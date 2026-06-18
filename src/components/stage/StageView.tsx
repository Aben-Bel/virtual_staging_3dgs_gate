import { useEffect, useState } from 'react';
import { useViews } from '../../hooks/useViews';
import { selectActiveView } from '../../state/selectors';
import { useStore } from '../../state/store';
import { useI18n, type Dict } from '../../i18n';
import { SplatViewer } from '../views/SplatViewer';
import { BeforeAfter } from './BeforeAfter';
import { Button } from '../ui/Button';
import type { StagingState } from '../../state/machines/staging';
import styles from './stage.module.css';

interface Props {
  staging: StagingState;
  onRetry: () => void;
  onCancel: () => void;
}

type Mode = 'navigate' | 'compare';

/** Center: navigate the splat (capture angles) or compare original vs staged. */
export function StageView({ staging, onRetry, onCancel }: Props) {
  const { t } = useI18n();
  const { splat, captureView } = useViews();
  const { state } = useStore();
  const activeView = selectActiveView(state);
  const [mode, setMode] = useState<Mode>('navigate');

  const hasOutput =
    staging.status === 'loading' || staging.status === 'result' || staging.status === 'error';

  // Surface progress/result automatically.
  useEffect(() => {
    if (staging.status === 'loading' || staging.status === 'result') setMode('compare');
  }, [staging.status]);

  return (
    <main className={styles.stage}>
      <div className={styles.toolbar}>
        <div className={styles.segmented}>
          <button
            className={mode === 'navigate' ? styles.segActive : styles.seg}
            onClick={() => setMode('navigate')}
          >
            {t.stage.navigate}
          </button>
          <button
            className={mode === 'compare' ? styles.segActive : styles.seg}
            onClick={() => setMode('compare')}
            disabled={!hasOutput}
          >
            {t.stage.compare}
          </button>
        </div>
        {mode === 'navigate' && splat && (
          <Button variant="accent" onClick={captureView} className={styles.captureBtn}>
            {t.stage.capture}
          </Button>
        )}
      </div>

      <div className={styles.area}>
        {mode === 'navigate' ? (
          <>
            <SplatViewer splat={splat} />
            {activeView && (
              <img className={styles.activeThumb} src={activeView.dataUrl} alt={activeView.label} />
            )}
          </>
        ) : (
          <CompareArea
            staging={staging}
            beforeSrc={activeView?.dataUrl ?? null}
            onRetry={onRetry}
            onCancel={onCancel}
            t={t}
          />
        )}
      </div>
    </main>
  );
}

function CompareArea({
  staging,
  beforeSrc,
  onRetry,
  onCancel,
  t,
}: {
  staging: StagingState;
  beforeSrc: string | null;
  onRetry: () => void;
  onCancel: () => void;
  t: Dict;
}) {
  if (staging.status === 'loading') {
    return (
      <div className={styles.center}>
        <div className={styles.spinner} />
        <span className={styles.muted}>{t.stage.starting}</span>
        <Button variant="ghost" onClick={onCancel}>{t.stage.cancel}</Button>
      </div>
    );
  }
  if (staging.status === 'error') {
    return (
      <div className={styles.center}>
        <span className={styles.errorTitle}>{t.errors[staging.error.kind]}</span>
        <span className={styles.muted}>{staging.error.message}</span>
        {staging.error.kind !== 'rate_limited' && (
          <Button variant="accent" onClick={onRetry}>{t.stage.retry}</Button>
        )}
      </div>
    );
  }
  if (staging.status === 'result' && beforeSrc) {
    return (
      <>
        <BeforeAfter
          beforeSrc={beforeSrc}
          afterSrc={staging.imageDataUrl}
          beforeLabel={t.stage.original}
          afterLabel={t.stage.staged}
        />
        <a className={styles.download} href={staging.imageDataUrl} download="staged.png">
          {t.stage.download}
        </a>
      </>
    );
  }
  return (
    <div className={styles.center}>
      <span className={styles.muted}>{t.stage.emptyCompare}</span>
    </div>
  );
}
