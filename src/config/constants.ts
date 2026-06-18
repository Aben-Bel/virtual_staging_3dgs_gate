/**
 * Non-string app constants. Numbers, endpoints, and enumerable config live here
 * (UI copy lives in src/i18n.ts; visual tokens live in src/styles/tokens.css).
 */

export const STAGING = {
  /** How long to wait for an image before giving up (image gen can be slow). */
  timeoutMs: 180_000, // 3 minutes
  /** Debounce for prompt/preset edits before the machine is "ready". */
  debounceMs: 300,
  /** Gentle auto-retry count for transient rate limits (not hard quota). */
  rateLimitAutoRetries: 1,
} as const;

export const GEMINI = {
  endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
} as const;

export interface ModelOption {
  id: string;
  label: string;
}

/** Selectable image models (2026). Order = display order in the selector. */
export const MODELS: ModelOption[] = [
  { id: 'gemini-3.1-flash-image', label: 'Nano Banana 2 · 3.1 Flash (fast)' },
  { id: 'gemini-3-pro-image', label: 'Nano Banana Pro · 3 Pro (best fidelity)' },
  { id: 'gemini-2.5-flash-image', label: 'Nano Banana · 2.5 Flash (legacy)' },
];

export const DEFAULT_MODEL_ID = MODELS[0].id;
