import { useEffect, useReducer } from 'react';
import {
  connectivityReducer,
  initialConnectivityState,
} from '../state/machines/connectivity';

/** Tracks browser online/offline and exposes a transient "reconnected" state. */
export function useConnectivity() {
  const [state, dispatch] = useReducer(connectivityReducer, initialConnectivityState);

  useEffect(() => {
    const onOffline = () => dispatch({ type: 'WENT_OFFLINE' });
    const onOnline = () => dispatch({ type: 'CAME_ONLINE' });
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  // Auto-dismiss the "reconnected" banner.
  useEffect(() => {
    if (state.status !== 'reconnected') return;
    const t = setTimeout(() => dispatch({ type: 'ACK_RECONNECT' }), 2500);
    return () => clearTimeout(t);
  }, [state.status]);

  return {
    isOffline: state.status === 'offline',
    justReconnected: state.status === 'reconnected',
  };
}
