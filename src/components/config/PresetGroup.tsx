import type { PresetGroupDef } from '../../types';
import { useI18n } from '../../i18n';
import { Chip } from '../ui/Chip';
import styles from './config.module.css';

interface Props {
  group: PresetGroupDef;
  selectedId: string;
  onSelect: (groupId: string, optionId: string) => void;
}

/** Pure preset chip group. Labels are localized by id (fallback: config label). */
export function PresetGroup({ group, selectedId, onSelect }: Props) {
  const { t } = useI18n();
  return (
    <div className={styles.group}>
      <span className={styles.groupLabel}>{t.presets.groups[group.id] ?? group.label}</span>
      <div className={styles.chips}>
        {group.options.map((opt) => (
          <Chip
            key={opt.id}
            label={t.presets.options[opt.id] ?? opt.label}
            selected={opt.id === selectedId}
            onClick={() => onSelect(group.id, opt.id)}
          />
        ))}
      </div>
    </div>
  );
}
