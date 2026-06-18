import { createContext, useContext } from 'react';
import type { StagingProvider } from '../../types';

/** Injected at the app root; swap the value to change staging backends. */
export const StagingProviderContext = createContext<StagingProvider | null>(null);

export function useStagingProvider(): StagingProvider {
  const provider = useContext(StagingProviderContext);
  if (!provider) throw new Error('useStagingProvider must be used within a provider');
  return provider;
}
