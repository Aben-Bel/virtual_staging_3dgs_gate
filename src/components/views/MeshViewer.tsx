import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { useCaptureRef } from '../../services/splat/SplatRenderer';
import type { SplatSource } from '../../types';
import styles from './views.module.css';

interface Props {
  splat: SplatSource | null;
}

/**
 * Mesh viewer for Matterport-style exports (.glb / .gltf / .obj), rendered with
 * plain three.js. Satisfies the same capture seam (CaptureContext) as the splat
 * viewer, so staging/capture/pose are identical. The splat path is untouched.
 */
export function MeshViewer({ splat }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const captureRef = useCaptureRef();

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !splat) return;

    let raf = 0;
    let disposed = false;

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xffffff, 1.1));
    scene.add(new THREE.HemisphereLight(0xffffff, 0x404048, 1.0));
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(2, 4, 3);
    scene.add(dir);

    const camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.01,
      10000,
    );
    camera.position.set(0, 1, 4);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;

    captureRef.current = {
      capture: () => renderer.domElement.toDataURL('image/png'),
      getPose: () => ({
        position: [camera.position.x, camera.position.y, camera.position.z],
        target: [controls.target.x, controls.target.y, controls.target.z],
        up: [camera.up.x, camera.up.y, camera.up.z],
      }),
      setPose: (p) => {
        camera.position.set(...p.position);
        camera.up.set(...p.up);
        controls.target.set(...p.target);
        controls.update();
      },
    };

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);
    const resizeObserver = new ResizeObserver(() => onResize());
    resizeObserver.observe(container);

    const frameObject = (obj: THREE.Object3D) => {
      const box = new THREE.Box3().setFromObject(obj);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const dist = (maxDim / 2 / Math.tan((camera.fov * Math.PI) / 180 / 2)) * 1.3;
      camera.near = Math.max(dist / 1000, 0.001);
      camera.far = dist * 1000;
      camera.position.set(center.x, center.y + size.y * 0.1, center.z + dist);
      camera.updateProjectionMatrix();
      controls.target.copy(center);
      controls.update();
    };

    const onLoad = (obj: THREE.Object3D) => {
      if (disposed) return;
      scene.add(obj);
      frameObject(obj);
    };
    const onError = (e: unknown) => {
      if (!disposed) console.error('Mesh load failed:', e);
    };

    if (splat.format === 'obj') {
      new OBJLoader().load(splat.url, onLoad, undefined, onError);
    } else {
      new GLTFLoader().load(splat.url, (g) => onLoad(g.scene), undefined, onError);
    }

    const animate = () => {
      raf = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      resizeObserver.disconnect();
      captureRef.current = null;
      controls.dispose();
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        mesh.geometry?.dispose?.();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat?.dispose?.();
      });
      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [splat, captureRef]);

  if (!splat) return null;
  return <div ref={containerRef} className={styles.viewerCanvas} />;
}
