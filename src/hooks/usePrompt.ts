import { useCallback } from 'react';
import { useStore } from '../state/store';
import { composePrompt } from '../lib/composePrompt';

/**
 * Prompt behavior: selecting a preset rebuilds the prompt unless the user has
 * hand-edited it; "Rebuild from presets" forces a rebuild and clears dirty.
 */
export function usePrompt() {
  const { state, dispatch } = useStore();

  const selectPreset = useCallback(
    (groupId: string, optionId: string) => {
      const nextSelection = { ...state.presetSelection, [groupId]: optionId };
      dispatch({ type: 'SELECT_PRESET', groupId, optionId });
      if (!state.promptDirty) {
        dispatch({ type: 'REBUILD_PROMPT', prompt: composePrompt(nextSelection) });
      }
    },
    [state.presetSelection, state.promptDirty, dispatch],
  );

  const editPrompt = useCallback(
    (prompt: string) => dispatch({ type: 'SET_PROMPT', prompt, dirty: true }),
    [dispatch],
  );

  const rebuildFromPresets = useCallback(
    () => dispatch({ type: 'REBUILD_PROMPT', prompt: composePrompt(state.presetSelection) }),
    [state.presetSelection, dispatch],
  );

  return {
    prompt: state.prompt,
    promptDirty: state.promptDirty,
    selection: state.presetSelection,
    selectPreset,
    editPrompt,
    rebuildFromPresets,
  };
}
