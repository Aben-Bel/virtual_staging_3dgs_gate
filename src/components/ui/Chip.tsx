import styles from './Chip.module.css';

interface Props {
  label: string;
  selected: boolean;
  onClick: () => void;
}

/** Pure selectable chip. */
export function Chip({ label, selected, onClick }: Props) {
  return (
    <button
      type="button"
      className={`${styles.chip} ${selected ? styles.selected : ''}`}
      aria-pressed={selected}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
