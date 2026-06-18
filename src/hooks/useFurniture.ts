import { useCallback } from 'react';
import { useStore } from '../state/store';
import type { AssetRef } from '../types';

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Furniture tab state: free-text layout + reference image assets. */
export function useFurniture() {
  const { state, dispatch } = useStore();

  const setLayout = useCallback(
    (layout: string) => dispatch({ type: 'SET_LAYOUT', layout }),
    [dispatch],
  );

  const addAssets = useCallback(
    async (files: FileList | File[]) => {
      for (const file of Array.from(files)) {
        const dataUrl = await readFileAsDataUrl(file);
        const asset: AssetRef = { id: crypto.randomUUID(), name: file.name, dataUrl, note: '' };
        dispatch({ type: 'ADD_ASSET', asset });
      }
    },
    [dispatch],
  );

  const removeAsset = useCallback(
    (id: string) => dispatch({ type: 'REMOVE_ASSET', id }),
    [dispatch],
  );

  const setAssetNote = useCallback(
    (id: string, note: string) => dispatch({ type: 'SET_ASSET_NOTE', id, note }),
    [dispatch],
  );

  return { layout: state.layout, assets: state.assets, setLayout, addAssets, removeAsset, setAssetNote };
}
