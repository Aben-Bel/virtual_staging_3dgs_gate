import { useI18n } from '../../i18n';
import styles from './config.module.css';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

/** Pure API key input. Key is held in memory only. */
export function ApiKeyField({ value, onChange }: Props) {
  const { t } = useI18n();
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{t.config.apiKeyLabel}</label>
      <input
        type="password"
        className={styles.input}
        placeholder={t.config.apiKeyPlaceholder}
        value={value}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
      />
      <span className={styles.fieldHint}>{t.config.apiKeyHint}</span>
    </div>
  );
}
