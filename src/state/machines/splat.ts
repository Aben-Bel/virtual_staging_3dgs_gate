/** Splat loading machine for the left viewer. */

export type SplatState =
  | { status: 'empty' }
  | { status: 'loading'; progress: number }
  | { status: 'ready' }
  | { status: 'error'; reason: string };

export type SplatEvent =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_PROGRESS'; progress: number }
  | { type: 'LOAD_DONE' }
  | { type: 'LOAD_ERROR'; reason: string }
  | { type: 'RESET' };

export const initialSplatState: SplatState = { status: 'empty' };

export function splatReducer(state: SplatState, event: SplatEvent): SplatState {
  switch (event.type) {
    case 'LOAD_START':
      return { status: 'loading', progress: 0 };
    case 'LOAD_PROGRESS':
      return state.status === 'loading' ? { status: 'loading', progress: event.progress } : state;
    case 'LOAD_DONE':
      return { status: 'ready' };
    case 'LOAD_ERROR':
      return { status: 'error', reason: event.reason };
    case 'RESET':
      return { status: 'empty' };
    default:
      return state;
  }
}
