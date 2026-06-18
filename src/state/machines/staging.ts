import type { StagingErrorKind } from '../../types';

/**
 * Pure staging state machine: (state, event) => state.
 * No side-effects here — the hook (useStaging) performs fetch/timers/abort
 * and dispatches events back in.
 */

export interface StagingErrorInfo {
  kind: StagingErrorKind;
  message: string;
  retryAfterMs?: number;
}

export type StagingState =
  | { status: 'empty' }
  | { status: 'ready' }
  | { status: 'debouncing' }
  | { status: 'loading'; attempt: number }
  | { status: 'result'; imageDataUrl: string }
  | { status: 'error'; error: StagingErrorInfo; attempt: number };

export type StagingEvent =
  | { type: 'VIEW_AVAILABLE' } // an active view + key + prompt exist
  | { type: 'VIEW_CLEARED' } // no active view
  | { type: 'INPUT_EDITED' } // prompt or presets changed (start debounce)
  | { type: 'INPUT_SETTLED' } // debounce elapsed
  | { type: 'SUBMIT' }
  | { type: 'SUCCESS'; imageDataUrl: string }
  | { type: 'FAILURE'; error: StagingErrorInfo }
  | { type: 'RETRY' }
  | { type: 'CANCEL' };

export const initialStagingState: StagingState = { status: 'empty' };

export function stagingReducer(state: StagingState, event: StagingEvent): StagingState {
  switch (event.type) {
    case 'VIEW_CLEARED':
      return { status: 'empty' };

    case 'VIEW_AVAILABLE':
      // Becoming ready only matters when we were empty; don't clobber a result.
      return state.status === 'empty' ? { status: 'ready' } : state;

    case 'INPUT_EDITED':
      // Debounce only from ready; keep a shown result/error visible while typing.
      if (state.status === 'ready' || state.status === 'debouncing') {
        return { status: 'debouncing' };
      }
      return state;

    case 'INPUT_SETTLED':
      return state.status === 'debouncing' ? { status: 'ready' } : state;

    case 'SUBMIT':
      if (state.status === 'ready' || state.status === 'result' || state.status === 'error') {
        return { status: 'loading', attempt: 1 };
      }
      return state;

    case 'RETRY':
      if (state.status === 'error') {
        return { status: 'loading', attempt: state.attempt + 1 };
      }
      return state;

    case 'SUCCESS':
      if (state.status === 'loading') return { status: 'result', imageDataUrl: event.imageDataUrl };
      return state;

    case 'FAILURE':
      if (state.status === 'loading') {
        return { status: 'error', error: event.error, attempt: state.attempt };
      }
      return state;

    case 'CANCEL':
      if (state.status === 'loading') return { status: 'ready' };
      return state;

    default:
      return state;
  }
}
