import { useEffect, useState } from 'react';
import { useViews } from '../../hooks/useViews';
import { selectActiveView } from '../../state/selectors';
import { useStore } from '../../state/store';
import { useI18n, type Dict } from '../../i18n';
import { SplatViewer } from '../views/SplatViewer';
import { MeshViewer } from '../views/MeshViewer';
import { isMeshSource } from '../../services/splat/SplatRenderer';
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

  // The active capture carries its own staged result, so switching views shows
  // the right pairing instead of one shared/global result.
  const stagedDataUrl = activeView?.stagedDataUrl ?? null;
  const hasOutput = staging.status === 'loading' || staging.status === 'error' || !!stagedDataUrl;

  // Show progress while staging.
  useEffect(() => {
    if (staging.status === 'loading') setMode('compare');
  }, [staging.status]);

  // When the active view changes, show its result if it has one, else navigate
  // back to that view's camera angle.
  useEffect(() => {
    setMode(stagedDataUrl ? 'compare' : 'navigate');
  }, [activeView?.id, stagedDataUrl]);

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
        {/* Viewer stays mounted across modes so the camera/pose persists and the
            splat is never reloaded; Compare renders as an overlay on top.
            Mesh sources (Matterport GLB/OBJ) use MeshViewer; splats use SplatViewer. */}
        {isMeshSource(splat) ? (
          <MeshViewer splat={splat} paused={mode === 'compare'} />
        ) : (
          <SplatViewer splat={splat} paused={mode === 'compare'} />
        )}
        {mode === 'navigate' && activeView && (
          <img className={styles.activeThumb} src={activeView.dataUrl} alt={activeView.label} />
        )}
        {mode === 'compare' && (
          <div className={styles.compareOverlay}>
            <CompareArea
              staging={staging}
              beforeSrc={activeView?.dataUrl ?? null}
              afterSrc={stagedDataUrl}
              onRetry={onRetry}
              onCancel={onCancel}
              t={t}
            />
          </div>
        )}
      </div>
    </main>
  );
}

function CompareArea({
  staging,
  beforeSrc,
  afterSrc,
  onRetry,
  onCancel,
  t,
}: {
  staging: StagingState;
  beforeSrc: string | null;
  afterSrc: string | null;
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
  // Prefer the active view's own staged result (persists across view switches).
  if (afterSrc && beforeSrc) {
    return (
      <>
        <BeforeAfter
          beforeSrc={beforeSrc}
          afterSrc={afterSrc}
          beforeLabel={t.stage.original}
          afterLabel={t.stage.staged}
        />
        <a className={styles.download} href={afterSrc} download="staged.png">
          {t.stage.download}
        </a>
      </>
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
  return (
    <div className={styles.center}>
      <span className={styles.muted}>{t.stage.emptyCompare}</span>
    </div>
  );
}
