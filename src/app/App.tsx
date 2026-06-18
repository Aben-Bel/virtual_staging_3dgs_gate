import { useEffect } from 'react';
import { useConnectivity } from '../hooks/useConnectivity';
import { useStaging } from '../hooks/useStaging';
import { useI18n } from '../i18n';
import { ViewsPanel } from '../components/views/ViewsPanel';
import { StageView } from '../components/stage/StageView';
import { ConfigPanel } from '../components/config/ConfigPanel';
import { ConnectivityBanner } from '../components/ConnectivityBanner';
import styles from './App.module.css';

/**
 * Composition root: owns the single staging + connectivity machine instances
 * and wires the three panels. No business logic lives here.
 */
export function App() {
  const { t } = useI18n();
  const { isOffline, justReconnected } = useConnectivity();
  const { state, canStage, submit, retry, cancel } = useStaging({ isOffline, justReconnected });

  useEffect(() => {
    document.title = t.app.title;
  }, [t.app.title]);

  return (
    <div className={styles.shell}>
      <ConnectivityBanner isOffline={isOffline} justReconnected={justReconnected} />
      <div className={styles.body}>
        <ViewsPanel />
        <StageView staging={state} onRetry={retry} onCancel={cancel} />
        <ConfigPanel staging={state} canStage={canStage} onSubmit={submit} />
      </div>
    </div>
  );
}
