import { useI18n } from '../../i18n';
import styles from './config.module.css';

interface Props {
  value: string;
  dirty: boolean;
  onChange: (v: string) => void;
  onRebuild: () => void;
}

/** Pure prompt textarea with a rebuild-from-presets action. */
export function PromptBox({ value, dirty, onChange, onRebuild }: Props) {
  const { t } = useI18n();
  return (
    <div className={styles.group}>
      <div className={styles.promptHead}>
        <span className={styles.groupLabel}>{t.config.promptLabel}</span>
        <button
          className={styles.rebuild}
          onClick={onRebuild}
          disabled={!dirty}
          title={dirty ? t.config.rebuildTitleDirty : t.config.rebuildTitleClean}
        >
          {t.config.rebuild}
        </button>
      </div>
      <textarea
        className={styles.textarea}
        rows={5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t.config.promptPlaceholder}
      />
    </div>
  );
}
