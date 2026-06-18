import { useI18n } from '../i18n';
import styles from './ConnectivityBanner.module.css';

interface Props {
  isOffline: boolean;
  justReconnected: boolean;
}

/** Pure top banner for connectivity changes. */
export function ConnectivityBanner({ isOffline, justReconnected }: Props) {
  const { t } = useI18n();
  if (isOffline) {
    return <div className={`${styles.banner} ${styles.offline}`}>{t.connectivity.offline}</div>;
  }
  if (justReconnected) {
    return <div className={`${styles.banner} ${styles.online}`}>{t.connectivity.reconnected}</div>;
  }
  return null;
}
