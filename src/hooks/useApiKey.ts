import { useCallback } from 'react';
import { useStore } from '../state/store';

/** API key lives only in memory (cleared on refresh) per the design. */
export function useApiKey() {
  const { state, dispatch } = useStore();
  const setApiKey = useCallback(
    (apiKey: string) => dispatch({ type: 'SET_API_KEY', apiKey }),
    [dispatch],
  );
  return { apiKey: state.apiKey, setApiKey, hasKey: Boolean(state.apiKey.trim()) };
}
