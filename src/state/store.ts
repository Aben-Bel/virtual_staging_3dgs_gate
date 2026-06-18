import { createContext, useContext } from 'react';
import type { AssetRef, CapturedView, PresetSelection, SplatSource } from '../types';
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
  /** Free-text furniture & positions description (Furniture tab). */
  layout: string;
  /** Reference images to place into the venue (Furniture tab). */
  assets: AssetRef[];
}

export type AppAction =
  | { type: 'SET_SPLAT'; splat: SplatSource | null }
  | { type: 'ADD_VIEW'; view: CapturedView }
  | { type: 'REMOVE_VIEW'; id: string }
  | { type: 'SET_ACTIVE_VIEW'; id: string }
  | { type: 'SET_REF_VIEW'; id: string }
  | { type: 'SET_VIEW_RESULT'; id: string; stagedDataUrl: string }
  | { type: 'SET_API_KEY'; apiKey: string }
  | { type: 'SET_MODEL'; model: string }
  | { type: 'SELECT_PRESET'; groupId: string; optionId: string }
  | { type: 'SET_PROMPT'; prompt: string; dirty: boolean }
  | { type: 'REBUILD_PROMPT'; prompt: string }
  | { type: 'SET_LAYOUT'; layout: string }
  | { type: 'ADD_ASSET'; asset: AssetRef }
  | { type: 'REMOVE_ASSET'; id: string }
  | { type: 'SET_ASSET_NOTE'; id: string; note: string };

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
  layout: '',
  assets: [],
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SPLAT':
      return { ...state, splat: action.splat };

    case 'ADD_VIEW': {
      const views = [...state.views, action.view];
      // A fresh capture becomes the active view; uploads only if nothing is active.
      const activate = action.view.origin === 'capture' || state.activeViewId === null;
      return { ...state, views, activeViewId: activate ? action.view.id : state.activeViewId };
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

    case 'SET_VIEW_RESULT':
      return {
        ...state,
        views: state.views.map((v) =>
          v.id === action.id ? { ...v, stagedDataUrl: action.stagedDataUrl } : v,
        ),
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

    case 'SET_LAYOUT':
      return { ...state, layout: action.layout };

    case 'ADD_ASSET':
      return { ...state, assets: [...state.assets, action.asset] };

    case 'REMOVE_ASSET':
      return { ...state, assets: state.assets.filter((a) => a.id !== action.id) };

    case 'SET_ASSET_NOTE':
      return {
        ...state,
        assets: state.assets.map((a) => (a.id === action.id ? { ...a, note: action.note } : a)),
      };

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
