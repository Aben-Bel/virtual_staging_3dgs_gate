import { useI18n } from '../../i18n';
import { useTheme } from '../../theme';
import styles from './config.module.css';

/** Toggle between dark and light; label shows the theme you'll switch to. */
export function ThemeSwitch() {
  const { t } = useI18n();
  const { theme, toggle } = useTheme();
  const next = theme === 'dark' ? t.config.themeLight : t.config.themeDark;
  return (
    <button className={styles.themeBtn} onClick={toggle} title={next}>
      {next}
    </button>
  );
}
