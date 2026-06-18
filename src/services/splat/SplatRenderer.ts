import { createContext, useContext, type MutableRefObject } from 'react';
import type { SplatSource } from '../../types';

/**
 * Renderer contract. The current implementation is an R3F component
 * (components/SplatViewer), but anything that can (a) render a SplatSource and
 * (b) capture the current frame as a PNG data URL satisfies this seam.
 */
export interface SplatRendererHandle {
  /** Capture the current camera view as a PNG data URL, or null if unavailable. */
  capture(): string | null;
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
