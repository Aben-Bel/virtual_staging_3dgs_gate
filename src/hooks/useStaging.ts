import { useCallback, useEffect, useReducer, useRef } from 'react';
import { useStore } from '../state/store';
import { selectActiveView, selectCanStage } from '../state/selectors';
import { useStagingProvider } from '../services/staging/context';
import {
  initialStagingState,
  stagingReducer,
  type StagingErrorInfo,
} from '../state/machines/staging';
import { StagingError } from '../types';
import { STAGING } from '../config/constants';

function backoffMs(attempt: number): number {
  return Math.min(8000, 2000 * attempt); // 2s, then manual
}

function toErrorInfo(err: unknown): StagingErrorInfo {
  if (err instanceof StagingError) {
    return { kind: err.kind, message: err.message, retryAfterMs: err.retryAfterMs };
  }
  return { kind: 'unknown', message: err instanceof Error ? err.message : 'Unexpected error.' };
}

function splitDataUrl(dataUrl: string): { mimeType: string; base64: string } {
  const match = /^data:([^;]+);base64,(.*)$/.exec(dataUrl);
  if (!match) return { mimeType: 'image/png', base64: dataUrl };
  return { mimeType: match[1], base64: match[2] };
}

interface UseStagingArgs {
  isOffline: boolean;
  justReconnected: boolean;
}

/**
 * Drives the staging machine: performs the request as a side-effect of entering
 * `loading`, with abort, timeout (in provider), debounce, and auto-retry for
 * rate-limit / reconnection. All async lives here; the machine stays pure.
 */
export function useStaging({ isOffline, justReconnected }: UseStagingArgs) {
  const { state: app } = useStore();
  const provider = useStagingProvider();
  const [state, dispatch] = useReducer(stagingReducer, initialStagingState);

  const activeView = selectActiveView(app);
  const canStage = selectCanStage(app) && !isOffline;

  // Latest request params, read inside the loading effect without re-triggering it.
  const paramsRef = useRef({ activeView, prompt: app.prompt, apiKey: app.apiKey, model: app.model });
  paramsRef.current = { activeView, prompt: app.prompt, apiKey: app.apiKey, model: app.model };

  // Reflect "is there a view to stage" into the machine.
  useEffect(() => {
    dispatch({ type: activeView ? 'VIEW_AVAILABLE' : 'VIEW_CLEARED' });
  }, [activeView]);

  // Debounce input edits (prompt / presets).
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    dispatch({ type: 'INPUT_EDITED' });
    const t = setTimeout(() => dispatch({ type: 'INPUT_SETTLED' }), STAGING.debounceMs);
    return () => clearTimeout(t);
  }, [app.prompt, app.presetSelection]);

  // Perform the request whenever we enter a loading state (fresh submit or retry).
  const isLoading = state.status === 'loading';
  const attempt = state.status === 'loading' ? state.attempt : 0;
  useEffect(() => {
    if (!isLoading) return;
    const { activeView: view, prompt, apiKey, model } = paramsRef.current;
    if (!view) {
      dispatch({ type: 'FAILURE', error: { kind: 'unknown', message: 'No active view.' } });
      return;
    }
    const controller = new AbortController();
    let cancelled = false;
    const { mimeType, base64 } = splitDataUrl(view.dataUrl);

    provider
      .stage({ imageBase64: base64, mimeType, prompt, apiKey, model, signal: controller.signal })
      .then((res) => {
        if (!cancelled) dispatch({ type: 'SUCCESS', imageDataUrl: res.imageDataUrl });
      })
      .catch((err) => {
        if (!cancelled) dispatch({ type: 'FAILURE', error: toErrorInfo(err) });
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, attempt, provider]);

  // Auto-retry rate-limit with backoff.
  useEffect(() => {
    if (state.status !== 'error') return;
    if (state.error.kind === 'rate_limited' && state.attempt <= STAGING.rateLimitAutoRetries) {
      const delay = state.error.retryAfterMs ?? backoffMs(state.attempt);
      const t = setTimeout(() => dispatch({ type: 'RETRY' }), delay);
      return () => clearTimeout(t);
    }
  }, [state]);

  // Auto-retry once when connectivity returns after an offline failure.
  useEffect(() => {
    if (justReconnected && state.status === 'error' && state.error.kind === 'offline') {
      dispatch({ type: 'RETRY' });
    }
  }, [justReconnected, state]);

  const submit = useCallback(() => {
    if (!canStage) return;
    dispatch({ type: 'SUBMIT' });
  }, [canStage]);

  const retry = useCallback(() => dispatch({ type: 'RETRY' }), []);
  const cancel = useCallback(() => dispatch({ type: 'CANCEL' }), []);

  return { state, canStage, submit, retry, cancel };
}
