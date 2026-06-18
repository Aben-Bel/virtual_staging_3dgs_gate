import { PRESET_GROUPS, PROMPT_SUFFIX } from '../config/presets';
import type { PresetSelection } from '../types';

/** Pure: compose a natural-language prompt from a preset selection. */
export function composePrompt(selection: PresetSelection): string {
  const fragments = PRESET_GROUPS.map((group) => {
    const optionId = selection[group.id];
    return group.options.find((o) => o.id === optionId)?.fragment ?? '';
  }).filter(Boolean);

  if (fragments.length === 0) return PROMPT_SUFFIX;
  const joined = fragments.join(', ');
  return `${joined.charAt(0).toUpperCase()}${joined.slice(1)}. ${PROMPT_SUFFIX}`;
}
