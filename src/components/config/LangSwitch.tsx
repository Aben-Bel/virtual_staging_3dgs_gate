import { LOCALES, useI18n } from '../../i18n';
import styles from './config.module.css';

/** Pure-ish language toggle (EN / DE). Reads locale from i18n context. */
export function LangSwitch() {
  const { locale, setLocale } = useI18n();
  return (
    <div className={styles.langSwitch}>
      {LOCALES.map((l) => (
        <button
          key={l.id}
          className={l.id === locale ? styles.langActive : styles.lang}
          onClick={() => setLocale(l.id)}
          aria-pressed={l.id === locale}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
