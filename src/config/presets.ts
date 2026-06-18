import type { PresetGroupDef } from '../types';

/**
 * Data-driven preset chips. Add/edit groups or options here — the UI renders
 * whatever this array contains; no component changes needed.
 *
 * Each selected option contributes its `fragment` to the composed prompt.
 * The `none` option of each group contributes an empty fragment.
 */
export const PRESET_GROUPS: PresetGroupDef[] = [
  {
    id: 'stage',
    label: 'Stage',
    defaultOptionId: 'stage-small',
    options: [
      { id: 'stage-none', label: 'None', fragment: '' },
      { id: 'stage-small', label: 'Small', fragment: 'a small elevated stage at the front of the room' },
      { id: 'stage-large', label: 'Large', fragment: 'a large raised stage with steps at the front' },
      { id: 'stage-full', label: 'Full width', fragment: 'a full-width stage spanning the front wall' },
    ],
  },
  {
    id: 'seating',
    label: 'Seating',
    defaultOptionId: 'seating-round',
    options: [
      { id: 'seating-none', label: 'None', fragment: '' },
      { id: 'seating-theatre', label: 'Theatre rows', fragment: 'rows of chairs in theatre-style seating facing the stage' },
      { id: 'seating-round', label: 'Round tables', fragment: 'round banquet tables with chairs arranged around them' },
      { id: 'seating-banquet', label: 'Banquet', fragment: 'long banquet tables with chairs' },
      { id: 'seating-cocktail', label: 'Cocktail', fragment: 'standing cocktail tables scattered through the space' },
    ],
  },
  {
    id: 'lighting',
    label: 'Lighting',
    defaultOptionId: 'lighting-bright',
    options: [
      { id: 'lighting-current', label: 'Current', fragment: '' },
      { id: 'lighting-bright', label: 'Bright', fragment: 'bright even professional lighting throughout' },
      { id: 'lighting-dramatic', label: 'Dramatic', fragment: 'dramatic focused stage lighting with dimmed surroundings' },
      { id: 'lighting-intimate', label: 'Intimate', fragment: 'warm intimate lighting with soft accents' },
    ],
  },
  {
    id: 'decor',
    label: 'Decor',
    defaultOptionId: 'decor-corporate',
    options: [
      { id: 'decor-none', label: 'None', fragment: '' },
      { id: 'decor-wedding', label: 'Wedding', fragment: 'elegant wedding decor with floral centerpieces and drapery' },
      { id: 'decor-corporate', label: 'Corporate', fragment: 'corporate branded backdrop and presentation screens' },
      { id: 'decor-party', label: 'Party', fragment: 'festive party decor with balloons and color accents' },
      { id: 'decor-concert', label: 'Concert', fragment: 'concert-style staging with truss lighting rig and speakers' },
    ],
  },
];

/** Trailing instruction appended after the preset/edited prompt. */
export const PROMPT_SUFFIX =
  'Keep the architecture and dimensions of the room preserved.';

/**
 * Always prepended to every staging request, independent of the editable prompt.
 * Pushes the model to treat the venue as fixed and only ADD furniture/decor.
 * (2D best-effort — not a hard guarantee.)
 */
export const PRESERVATION_INSTRUCTION =
  'This is a photo of a real venue. Keep the venue EXACTLY as it is: do not change ' +
  'the walls, windows, doors, ceiling, floor, structure, proportions, camera angle, ' +
  'or existing lighting. Do not remove anything that is already there. ONLY ADD the ' +
  'requested furniture and decor on top of the existing space, matching its perspective ' +
  'and lighting so the additions look naturally placed. Staging request: ';
