import { createContext, useContext, type MutableRefObject } from 'react';
import type { CameraPose, SplatSource } from '../../types';

/**
 * Renderer contract. Anything that can render a SplatSource, capture the
 * current frame, and read/restore the camera pose satisfies this seam.
 */
export interface SplatRendererHandle {
  /** Capture the current camera view as a PNG data URL, or null if unavailable. */
  capture(): string | null;
  /** Current camera pose, or null if unavailable. */
  getPose(): CameraPose | null;
  /** Restore a previously captured camera pose. */
  setPose(pose: CameraPose): void;
}

/** Shared handle: the viewer registers itself; toolbars/buttons call capture(). */
export type CaptureRef = MutableRefObject<SplatRendererHandle | null>;

export const CaptureContext = createContext<CaptureRef | null>(null);

export function useCaptureRef(): CaptureRef {
  const ref = useContext(CaptureContext);
  if (!ref) throw new Error('useCaptureRef must be used within <CaptureContext.Provider>');
  return ref;
}

export function inferFormat(name: string): SplatSource['format'] {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'splat' || ext === 'ply' || ext === 'ksplat') return ext;
  return 'unknown';
}
