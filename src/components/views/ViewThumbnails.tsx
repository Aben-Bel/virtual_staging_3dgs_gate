import type { CapturedView } from '../../types';
import { useI18n } from '../../i18n';
import styles from './views.module.css';

interface Props {
  views: CapturedView[];
  activeViewId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onSetRef: (id: string) => void;
}

/** Pure list of captured/uploaded views. */
export function ViewThumbnails({ views, activeViewId, onSelect, onRemove, onSetRef }: Props) {
  const { t } = useI18n();
  if (views.length === 0) {
    return <p className={styles.thumbsEmpty}>{t.views.empty}</p>;
  }
  return (
    <ul className={styles.thumbs}>
      {views.map((v) => (
        <li
          key={v.id}
          className={`${styles.thumb} ${v.id === activeViewId ? styles.thumbActive : ''}`}
        >
          <button className={styles.thumbImgBtn} onClick={() => onSelect(v.id)} title={v.label}>
            <img src={v.dataUrl} alt={v.label} />
            {v.isRef && <span className={styles.refBadge}>Ref</span>}
          </button>
          <div className={styles.thumbBar}>
            <span className={styles.thumbLabel}>{v.label}</span>
            <span className={styles.thumbActions}>
              <button
                onClick={() => onSetRef(v.id)}
                title={t.views.useAsRef}
                className={styles.thumbAction}
              >
                ☆
              </button>
              <button
                onClick={() => onRemove(v.id)}
                title={t.views.remove}
                className={styles.thumbAction}
              >
                ✕
              </button>
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
