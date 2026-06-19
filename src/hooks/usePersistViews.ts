import { useEffect } from 'react';
import { useStore } from '../state/store';
import { saveViews } from '../services/persistence/viewStore';

/**
 * Persists the current splat's views (captures + staged results) to IndexedDB
 * whenever they change, keyed by the splat's content hash. Debounced so rapid
 * edits don't thrash the store.
 */
export function usePersistViews() {
  const { state } = useStore();
  const hash = state.splat?.hash;
  const views = state.views;

  useEffect(() => {
    if (!hash) return;
    const t = setTimeout(() => {
      void saveViews(hash, views);
    }, 400);
    return () => clearTimeout(t);
  }, [hash, views]);
}
