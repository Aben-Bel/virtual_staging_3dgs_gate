import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';
import { useCaptureRef } from '../../services/splat/SplatRenderer';
import { useI18n } from '../../i18n';
import type { SplatSource } from '../../types';
import styles from './views.module.css';

interface Props {
  splat: SplatSource | null;
  /** Pause the render loop (e.g. while the compare overlay covers the viewer). */
  paused?: boolean;
}

const FORMAT: Record<string, number | undefined> = {
  ply: GaussianSplats3D.SceneFormat.Ply,
  splat: GaussianSplats3D.SceneFormat.Splat,
  ksplat: GaussianSplats3D.SceneFormat.KSplat,
};

/** Stop rendering this long after the last interaction (saves GPU when idle). */
const IDLE_MS = 2500;

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
 * Splat viewer backed by @mkkellogg/gaussian-splats-3d (.ply / .splat / .ksplat).
 *
 * The render loop runs ON DEMAND: it renders while you interact (and briefly
 * after, so the sort settles) and while loading, then stops when idle or when
 * `paused`. preserveDrawingBuffer keeps the last frame on screen while stopped.
 * This avoids pinning the GPU continuously (heat/slowdown) and the memory
 * pressure that led to WebGL context loss after capture.
 */
export function SplatViewer({ splat, paused = false }: Props) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const captureRef = useCaptureRef();
  const [upAxis, setUpAxis] = useState<UpAxis>('y-');

  // Lets the paused-prop effect wake/pause the loop without recreating the viewer.
  const pausedRef = useRef(paused);
  const wakeRef = useRef<() => void>(() => {});
  const applyPausedRef = useRef<(p: boolean) => void>(() => {});

  useEffect(() => {
    pausedRef.current = paused;
    applyPausedRef.current(paused);
  }, [paused]);

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

    // ---- On-demand render-loop control ----
    let running = false;
    let loading = true;
    let lastInteract = performance.now();

    const setRunning = (on: boolean) => {
      if (!viewer) return;
      if (on && !running && !pausedRef.current) {
        viewer.start();
        running = true;
      } else if (!on && running) {
        viewer.stop();
        running = false;
      }
    };
    const wake = () => {
      lastInteract = performance.now();
      setRunning(true);
    };
    wakeRef.current = wake;
    applyPausedRef.current = (p: boolean) => {
      if (p) setRunning(false);
      else wake();
    };

    // Stop when idle or paused; keep running while loading.
    const idle = window.setInterval(() => {
      if (loading) return;
      if (pausedRef.current) {
        setRunning(false);
      } else if (running && performance.now() - lastInteract > IDLE_MS) {
        setRunning(false);
      }
    }, 1000);

    // Wake on real interaction.
    const dom = renderer.domElement;
    const onDown = () => wake();
    const onWheel = () => wake();
    const onMove = (e: PointerEvent) => {
      if (e.buttons) wake();
    };
    const onKey = () => wake();
    dom.addEventListener('pointerdown', onDown);
    dom.addEventListener('wheel', onWheel, { passive: true });
    dom.addEventListener('pointermove', onMove);
    window.addEventListener('keydown', onKey);

    captureRef.current = {
      capture: () => {
        if (!renderer || !viewer) return null;
        // Render a fresh frame in case the loop is idle, then read it.
        try {
          viewer.update();
          viewer.render();
        } catch {
          /* not ready */
        }
        return renderer.domElement.toDataURL('image/png');
      },
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
        wake(); // render the restored view
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
      wake();
    };
    window.addEventListener('resize', onResize);
    const resizeObserver = new ResizeObserver(() => onResize?.());
    resizeObserver.observe(container);

    // Stop key events from form fields reaching the viewer's window shortcuts.
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

    // Run the loop during load so the loading UI + initial sort render.
    setRunning(true);

    viewer
      .addSplatScene(splat.url, { format: FORMAT[splat.format], showLoadingUI: true })
      .then(() => {
        if (cancelled || !viewer) return;
        loading = false;
        frameScene(viewer);
        wake(); // render a few seconds to let the sort settle, then idle
      })
      .catch((err: unknown) => {
        loading = false;
        if (!cancelled) console.error('Splat load failed:', err);
      });

    return () => {
      cancelled = true;
      window.clearInterval(idle);
      dom.removeEventListener('pointerdown', onDown);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('pointermove', onMove);
      window.removeEventListener('keydown', onKey);
      if (onResize) window.removeEventListener('resize', onResize);
      resizeObserver.disconnect();
      document.removeEventListener('keydown', stopKeysWhileTyping);
      document.removeEventListener('keyup', stopKeysWhileTyping);
      captureRef.current = null;
      wakeRef.current = () => {};
      applyPausedRef.current = () => {};
      const cleanupRenderer = renderer;
      const cleanupViewer = viewer;
      Promise.resolve(cleanupViewer?.dispose?.()).finally(() => {
        cleanupRenderer?.dispose();
        // Release the WebGL context so it isn't leaked across remounts.
        cleanupRenderer?.forceContextLoss();
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
