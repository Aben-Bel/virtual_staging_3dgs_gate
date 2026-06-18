import { useCallback } from 'react';
import { useStore } from '../state/store';

/** Selected image model id (held in app state, sent with each request). */
export function useModel() {
  const { state, dispatch } = useStore();
  const setModel = useCallback(
    (model: string) => dispatch({ type: 'SET_MODEL', model }),
    [dispatch],
  );
  return { model: state.model, setModel };
}
