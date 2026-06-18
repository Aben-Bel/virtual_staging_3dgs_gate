/** App-global connectivity machine. Gates staging submission. */

export type ConnectivityState =
  | { status: 'online' }
  | { status: 'offline' }
  | { status: 'reconnected' }; // transient: just came back

export type ConnectivityEvent = { type: 'WENT_OFFLINE' } | { type: 'CAME_ONLINE' } | { type: 'ACK_RECONNECT' };

export const initialConnectivityState: ConnectivityState = {
  status: typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'online',
};

export function connectivityReducer(
  state: ConnectivityState,
  event: ConnectivityEvent,
): ConnectivityState {
  switch (event.type) {
    case 'WENT_OFFLINE':
      return { status: 'offline' };
    case 'CAME_ONLINE':
      return state.status === 'offline' ? { status: 'reconnected' } : { status: 'online' };
    case 'ACK_RECONNECT':
      return { status: 'online' };
    default:
      return state;
  }
}
