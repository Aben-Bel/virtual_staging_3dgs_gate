import type { AppState } from './store';
import type { CapturedView } from '../types';

export const selectActiveView = (s: AppState): CapturedView | null =>
  s.views.find((v) => v.id === s.activeViewId) ?? null;

export const selectRefView = (s: AppState): CapturedView | null =>
  s.views.find((v) => v.isRef) ?? null;

/** Everything required before a staging request can be submitted. */
export const selectCanStage = (s: AppState): boolean =>
  Boolean(s.apiKey.trim()) && Boolean(selectActiveView(s)) && Boolean(s.prompt.trim());
