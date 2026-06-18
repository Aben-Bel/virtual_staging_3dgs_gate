import { useEffect, useState } from 'react';
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
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  useEffect(() => {
    document.title = t.app.title;
  }, [t.app.title]);

  return (
    <div className={styles.shell}>
      <ConnectivityBanner isOffline={isOffline} justReconnected={justReconnected} />
      <div className={styles.body}>
        <div className={styles.side}>
          {leftOpen && <ViewsPanel />}
          <button
            className={styles.rail}
            onClick={() => setLeftOpen((o) => !o)}
            title={leftOpen ? t.app.collapse : t.app.expand}
            aria-label={leftOpen ? t.app.collapse : t.app.expand}
          >
            {leftOpen ? '‹' : '›'}
          </button>
        </div>

        <StageView staging={state} onRetry={retry} onCancel={cancel} />

        <div className={styles.side}>
          <button
            className={styles.rail}
            onClick={() => setRightOpen((o) => !o)}
            title={rightOpen ? t.app.collapse : t.app.expand}
            aria-label={rightOpen ? t.app.collapse : t.app.expand}
          >
            {rightOpen ? '›' : '‹'}
          </button>
          {rightOpen && <ConfigPanel staging={state} canStage={canStage} onSubmit={submit} />}
        </div>
      </div>
    </div>
  );
}
