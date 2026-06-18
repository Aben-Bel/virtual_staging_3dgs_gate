import { MODELS } from '../../config/constants';
import styles from './config.module.css';

interface Props {
  label: string;
  value: string;
  onChange: (id: string) => void;
}

/** Pure image-model dropdown. Options come from config/constants. */
export function ModelSelector({ label, value, onChange }: Props) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      <select className={styles.select} value={value} onChange={(e) => onChange(e.target.value)}>
        {MODELS.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>
    </div>
  );
}
