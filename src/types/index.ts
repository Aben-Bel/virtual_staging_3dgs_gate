// ---------- Shared domain types ----------

/** A splat file the user imported. */
export interface SplatSource {
  id: string;
  name: string;
  url: string; // object URL
  format: 'splat' | 'ply' | 'ksplat' | 'unknown';
}

/** Camera pose remembered with a capture so the view can be restored. */
export interface CameraPose {
  position: [number, number, number];
  target: [number, number, number];
  up: [number, number, number];
}

/** A captured camera angle from the splat (or an uploaded reference image). */
export interface CapturedView {
  id: string;
  label: string; // e.g. "Auto-01"
  dataUrl: string; // PNG data URL
  origin: 'capture' | 'upload';
  isRef?: boolean;
  /** Camera pose at capture time (capture-origin views only). */
  pose?: CameraPose;
  /** Staged result for THIS view, so switching back shows its own result. */
  stagedDataUrl?: string;
}

/** A reference image (furniture/decor product shot) sent to the model alongside
 * the venue so it can place that item into the scene. */
export interface AssetRef {
  id: string;
  name: string;
  dataUrl: string;
  /** Optional placement note, e.g. "put near the stage". */
  note: string;
}

/** One selectable option inside a preset group. */
export interface PresetOption {
  id: string;
  label: string;
  /** Text fragment contributed to the composed prompt when selected. */
  fragment: string;
}

/** A group of mutually-exclusive preset chips (Stage, Seating, Lighting, Decor…). */
export interface PresetGroupDef {
  id: string;
  label: string;
  options: PresetOption[];
  /** id of the option selected by default. */
  defaultOptionId: string;
}

/** Map of groupId -> selected optionId. */
export type PresetSelection = Record<string, string>;

// ---------- Staging service contract ----------

export interface ReferenceImage {
  base64: string; // base64 WITHOUT data: prefix
  mimeType: string;
}

export interface StageRequest {
  imageBase64: string; // base64 WITHOUT data: prefix
  mimeType: string;
  prompt: string;
  apiKey: string;
  /** Image model id; falls back to the provider default when omitted. */
  model?: string;
  /** Extra reference images (furniture/decor) to place into the venue. */
  references?: ReferenceImage[];
  signal?: AbortSignal;
}

export interface StageResult {
  imageDataUrl: string; // full data: URL ready to render
}

/** Categorised failure so the UI can show the right message + retry policy. */
export type StagingErrorKind =
  | 'offline'
  | 'invalid_key'
  | 'rate_limited' // transient per-minute limit — retrying helps
  | 'quota' // hard cap / billing not enabled (e.g. free tier = 0) — retrying won't help
  | 'timeout'
  | 'empty_result'
  | 'unknown';

export class StagingError extends Error {
  kind: StagingErrorKind;
  retryAfterMs?: number;
  constructor(kind: StagingErrorKind, message: string, retryAfterMs?: number) {
    super(message);
    this.name = 'StagingError';
    this.kind = kind;
    this.retryAfterMs = retryAfterMs;
  }
}

/** Swappable backend (Gemini now, anything later). */
export interface StagingProvider {
  stage(req: StageRequest): Promise<StageResult>;
}
