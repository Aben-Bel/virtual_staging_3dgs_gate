import { useCallback } from 'react';
import { useStore } from '../state/store';
import { useCaptureRef, inferFormat } from '../services/splat/SplatRenderer';
import type { CapturedView, SplatSource } from '../types';

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Manages the splat source and the list of captured/uploaded views. */
export function useViews() {
  const { state, dispatch } = useStore();
  const captureRef = useCaptureRef();

  const importSplat = useCallback(
    (file: File) => {
      if (state.splat) URL.revokeObjectURL(state.splat.url);
      const splat: SplatSource = {
        id: crypto.randomUUID(),
        name: file.name,
        url: URL.createObjectURL(file),
        format: inferFormat(file.name),
      };
      dispatch({ type: 'SET_SPLAT', splat });
    },
    [state.splat, dispatch],
  );

  const captureView = useCallback(() => {
    const dataUrl = captureRef.current?.capture();
    if (!dataUrl) return;
    const pose = captureRef.current?.getPose() ?? undefined;
    const captureCount = state.views.filter((v) => v.origin === 'capture').length;
    const view: CapturedView = {
      id: crypto.randomUUID(),
      label: `Auto-${String(captureCount + 1).padStart(2, '0')}`,
      dataUrl,
      origin: 'capture',
      pose,
    };
    dispatch({ type: 'ADD_VIEW', view });
  }, [captureRef, state.views, dispatch]);

  const addReferenceImages = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      for (const file of list) {
        const dataUrl = await readFileAsDataUrl(file);
        dispatch({
          type: 'ADD_VIEW',
          view: { id: crypto.randomUUID(), label: file.name, dataUrl, origin: 'upload' },
        });
      }
    },
    [dispatch],
  );

  const removeView = useCallback((id: string) => dispatch({ type: 'REMOVE_VIEW', id }), [dispatch]);
  const setActiveView = useCallback(
    (id: string) => {
      dispatch({ type: 'SET_ACTIVE_VIEW', id });
      // Restore the camera to where this view was captured.
      const view = state.views.find((v) => v.id === id);
      if (view?.pose) captureRef.current?.setPose(view.pose);
    },
    [state.views, captureRef, dispatch],
  );
  const setRefView = useCallback((id: string) => dispatch({ type: 'SET_REF_VIEW', id }), [dispatch]);

  return {
    splat: state.splat,
    views: state.views,
    activeViewId: state.activeViewId,
    importSplat,
    captureView,
    addReferenceImages,
    removeView,
    setActiveView,
    setRefView,
  };
}
