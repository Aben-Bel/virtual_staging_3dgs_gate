import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';
import { useCaptureRef } from '../../services/splat/SplatRenderer';
import { useI18n } from '../../i18n';
import type { SplatSource } from '../../types';
import styles from './views.module.css';

interface Props {
  splat: SplatSource | null;
}

const FORMAT: Record<string, number | undefined> = {
  ply: GaussianSplats3D.SceneFormat.Ply,
  splat: GaussianSplats3D.SceneFormat.Splat,
  ksplat: GaussianSplats3D.SceneFormat.KSplat,
};

/**
 * Center the orbit target on the splat's actual center and frame the camera.
 * Without this, orbit/zoom pivot around the world origin (≠ scene center), so
 * the venue swings out of view. Retries briefly while bounds are computed.
 */
function frameScene(viewer: GaussianSplats3D.Viewer, attempt = 0): void {
  const center = viewer.splatMesh?.calculatedSceneCenter;
  const radius = viewer.splatMesh?.maxSplatDistanceFromSceneCenter ?? 0;
  if (!center || radius <= 0) {
    if (attempt < 30) requestAnimationFrame(() => frameScene(viewer, attempt + 1));
    return;
  }
  // Start the camera at the scene centre (in the middle), looking outward.
  viewer.camera?.position.set(center.x, center.y, center.z);
  viewer.controls?.target.set(center.x, center.y, center.z - 1);
  viewer.controls?.update();
}

/** Camera up-vectors for the orientation control (fixes upside-down captures). */
const UP_AXES = {
  'y+': [0, 1, 0],
  'y-': [0, -1, 0],
  'z+': [0, 0, 1],
  'z-': [0, 0, -1],
} as const;
type UpAxis = keyof typeof UP_AXES;

/**
 * Splat viewer backed by @mkkellogg/gaussian-splats-3d — loads .ply / .splat /
 * .ksplat. Full spherical harmonics + antialiasing for quality. Capture is
 * exposed via CaptureContext using a preserveDrawingBuffer renderer. An up-axis
 * control re-mounts with a different camera-up (the built-in orbit clamps polar
 * angle, so it can't flip an upside-down scene on its own).
 */
export function SplatViewer({ splat }: Props) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const captureRef = useCaptureRef();
  const [upAxis, setUpAxis] = useState<UpAxis>('y-');

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !splat) return;

    let viewer: GaussianSplats3D.Viewer | null = null;
    let renderer: THREE.WebGLRenderer | null = null;
    let cancelled = false;
    let onResize: (() => void) | null = null;

    renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    viewer = new GaussianSplats3D.Viewer({
      renderer,
      useBuiltInControls: true,
      sharedMemoryForWorkers: false,
      selfDrivenMode: true,
      cameraUp: [...UP_AXES[upAxis]],
      initialCameraPosition: [0, 1, -4],
      initialCameraLookAt: [0, 0, 0],
    });

    captureRef.current = {
      capture: () => (renderer ? renderer.domElement.toDataURL('image/png') : null),
      getPose: () => {
        const cam = viewer?.camera;
        const tgt = viewer?.controls?.target;
        if (!cam || !tgt) return null;
        return {
          position: [cam.position.x, cam.position.y, cam.position.z],
          target: [tgt.x, tgt.y, tgt.z],
          up: [cam.up.x, cam.up.y, cam.up.z],
        };
      },
      setPose: (pose) => {
        const cam = viewer?.camera;
        const controls = viewer?.controls;
        if (!cam || !controls) return;
        cam.position.set(...pose.position);
        cam.up.set(...pose.up);
        controls.target.set(...pose.target);
        controls.update();
      },
    };

    onResize = () => {
      if (!renderer || !viewer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      const cam = viewer.camera as THREE.PerspectiveCamera | undefined;
      if (cam) {
        cam.aspect = w / h;
        cam.updateProjectionMatrix();
      }
    };
    window.addEventListener('resize', onResize);
    // Also resize when the container itself changes (e.g. a sidebar collapses).
    const resizeObserver = new ResizeObserver(() => onResize?.());
    resizeObserver.observe(container);

    // The viewer's keyboard shortcuts are bound to window; stop key events that
    // come from form fields so typing in inputs doesn't move the camera.
    const stopKeysWhileTyping = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.tagName === 'SELECT' ||
          el.isContentEditable)
      ) {
        e.stopPropagation();
      }
    };
    document.addEventListener('keydown', stopKeysWhileTyping);
    document.addEventListener('keyup', stopKeysWhileTyping);

    viewer
      .addSplatScene(splat.url, { format: FORMAT[splat.format], showLoadingUI: true })
      .then(() => {
        if (cancelled || !viewer) return;
        viewer.start();
        onResize?.();
        frameScene(viewer);
      })
      .catch((err: unknown) => {
        if (!cancelled) console.error('Splat load failed:', err);
      });

    return () => {
      cancelled = true;
      if (onResize) window.removeEventListener('resize', onResize);
      resizeObserver.disconnect();
      document.removeEventListener('keydown', stopKeysWhileTyping);
      document.removeEventListener('keyup', stopKeysWhileTyping);
      captureRef.current = null;
      const cleanupRenderer = renderer;
      const cleanupViewer = viewer;
      Promise.resolve(cleanupViewer?.dispose?.()).finally(() => {
        cleanupRenderer?.dispose();
        if (cleanupRenderer?.domElement.parentNode === container) {
          container.removeChild(cleanupRenderer.domElement);
        }
      });
    };
  }, [splat, captureRef, upAxis]);

  if (!splat) {
    return (
      <div className={styles.viewerEmpty}>
        <p>{t.viewer.emptyTitle}</p>
        <span>{t.viewer.emptyFormats}</span>
      </div>
    );
  }

  return (
    <>
      <div ref={containerRef} className={styles.viewerCanvas} />
      <div className={styles.upAxis} title={t.viewer.upAxis}>
        <span className={styles.upAxisLabel}>{t.viewer.upAxis}</span>
        {(Object.keys(UP_AXES) as UpAxis[]).map((a) => (
          <button
            key={a}
            className={a === upAxis ? styles.upAxisActive : styles.upAxisBtn}
            onClick={() => setUpAxis(a)}
          >
            {a.toUpperCase()}
          </button>
        ))}
      </div>
    </>
  );
}
