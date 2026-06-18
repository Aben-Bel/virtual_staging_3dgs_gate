import { createContext, useContext } from 'react';
import type { CapturedView, PresetSelection, SplatSource } from '../types';
import { PRESET_GROUPS } from '../config/presets';
import { DEFAULT_MODEL_ID } from '../config/constants';
import { composePrompt } from '../lib/composePrompt';

/** App data state (the "what", not the async lifecycle — machines own that). */
export interface AppState {
  splat: SplatSource | null;
  views: CapturedView[];
  activeViewId: string | null;
  apiKey: string;
  model: string;
  presetSelection: PresetSelection;
  prompt: string;
  /** true once the user hand-edits the prompt → stop auto-rebuilding from presets. */
  promptDirty: boolean;
}

export type AppAction =
  | { type: 'SET_SPLAT'; splat: SplatSource | null }
  | { type: 'ADD_VIEW'; view: CapturedView }
  | { type: 'REMOVE_VIEW'; id: string }
  | { type: 'SET_ACTIVE_VIEW'; id: string }
  | { type: 'SET_REF_VIEW'; id: string }
  | { type: 'SET_API_KEY'; apiKey: string }
  | { type: 'SET_MODEL'; model: string }
  | { type: 'SELECT_PRESET'; groupId: string; optionId: string }
  | { type: 'SET_PROMPT'; prompt: string; dirty: boolean }
  | { type: 'REBUILD_PROMPT'; prompt: string };

export function defaultPresetSelection(): PresetSelection {
  return Object.fromEntries(PRESET_GROUPS.map((g) => [g.id, g.defaultOptionId]));
}

const initialSelection = defaultPresetSelection();

export const initialAppState: AppState = {
  splat: null,
  views: [],
  activeViewId: null,
  apiKey: '',
  model: DEFAULT_MODEL_ID,
  presetSelection: initialSelection,
  // Prompt reflects the default presets from the start.
  prompt: composePrompt(initialSelection),
  promptDirty: false,
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SPLAT':
      return { ...state, splat: action.splat };

    case 'ADD_VIEW': {
      const views = [...state.views, action.view];
      // First view auto-becomes active.
      return { ...state, views, activeViewId: state.activeViewId ?? action.view.id };
    }

    case 'REMOVE_VIEW': {
      const views = state.views.filter((v) => v.id !== action.id);
      const activeViewId =
        state.activeViewId === action.id ? (views[0]?.id ?? null) : state.activeViewId;
      return { ...state, views, activeViewId };
    }

    case 'SET_ACTIVE_VIEW':
      return { ...state, activeViewId: action.id };

    case 'SET_REF_VIEW':
      return {
        ...state,
        views: state.views.map((v) => ({ ...v, isRef: v.id === action.id })),
      };

    case 'SET_API_KEY':
      return { ...state, apiKey: action.apiKey };

    case 'SET_MODEL':
      return { ...state, model: action.model };

    case 'SELECT_PRESET':
      return {
        ...state,
        presetSelection: { ...state.presetSelection, [action.groupId]: action.optionId },
      };

    case 'SET_PROMPT':
      return { ...state, prompt: action.prompt, promptDirty: action.dirty };

    case 'REBUILD_PROMPT':
      return { ...state, prompt: action.prompt, promptDirty: false };

    default:
      return state;
  }
}

// ---- Context wiring (provider lives in app/providers.tsx) ----
export const StoreContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within <StoreProvider>');
  return ctx;
}
