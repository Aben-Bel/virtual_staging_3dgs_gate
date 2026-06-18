import { useMemo, useReducer, useRef, type ReactNode } from 'react';
import { StoreContext, appReducer, initialAppState } from '../state/store';
import { StagingProviderContext } from '../services/staging/context';
import { CaptureContext, type SplatRendererHandle } from '../services/splat/SplatRenderer';
import { GeminiProvider } from '../services/staging/GeminiProvider';
import { I18nProvider } from '../i18n';
import { ThemeProvider } from '../theme';
import type { StagingProvider } from '../types';

/**
 * Mounts all app-wide providers. Swap the staging backend in ONE place here.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialAppState);
  const captureRef = useRef<SplatRendererHandle | null>(null);

  const stagingProvider = useMemo<StagingProvider>(() => new GeminiProvider(), []);
  const store = useMemo(() => ({ state, dispatch }), [state]);

  return (
    <ThemeProvider>
      <I18nProvider>
        <StoreContext.Provider value={store}>
          <StagingProviderContext.Provider value={stagingProvider}>
            <CaptureContext.Provider value={captureRef}>{children}</CaptureContext.Provider>
          </StagingProviderContext.Provider>
        </StoreContext.Provider>
      </I18nProvider>
    </ThemeProvider>
  );
}
