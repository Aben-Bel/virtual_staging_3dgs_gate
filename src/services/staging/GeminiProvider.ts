import { StagingError } from '../../types';
import type { StageRequest, StageResult, StagingProvider } from '../../types';
import { GEMINI, STAGING, DEFAULT_MODEL_ID } from '../../config/constants';
import { PRESERVATION_INSTRUCTION } from '../../config/presets';

interface GeminiInlineData {
  mimeType?: string;
  mime_type?: string;
  data?: string;
}
interface GeminiPart {
  text?: string;
  inlineData?: GeminiInlineData;
  inline_data?: GeminiInlineData;
}
interface GeminiResponse {
  candidates?: { content?: { parts?: GeminiPart[] } }[];
  error?: { message?: string };
}

/**
 * Browser-side Gemini image-editing provider. Calls the REST endpoint directly
 * with the user's key so we keep full control over status codes (for the error
 * taxonomy), timeout, and abort. Swap this file to change backends.
 */
export class GeminiProvider implements StagingProvider {
  constructor(
    private readonly defaultModel: string = DEFAULT_MODEL_ID,
    private readonly timeoutMs: number = STAGING.timeoutMs,
  ) {}

  async stage(req: StageRequest): Promise<StageResult> {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      throw new StagingError('offline', 'No internet connection.');
    }

    const model = req.model || this.defaultModel;
    const url = `${GEMINI.endpoint}/${model}:generateContent?key=${encodeURIComponent(req.apiKey)}`;
    // Venue image first, then any reference images (furniture/decor) to place in.
    const reqParts: Array<Record<string, unknown>> = [
      { text: PRESERVATION_INSTRUCTION + req.prompt },
      { inline_data: { mime_type: req.mimeType, data: req.imageBase64 } },
    ];
    for (const ref of req.references ?? []) {
      reqParts.push({ inline_data: { mime_type: ref.mimeType, data: ref.base64 } });
    }
    const body = { contents: [{ parts: reqParts }] };

    // Compose caller abort with our own timeout.
    const timeoutCtrl = new AbortController();
    const timer = setTimeout(() => timeoutCtrl.abort(), this.timeoutMs);
    const signal = mergeSignals(req.signal, timeoutCtrl.signal);

    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal,
      });
    } catch (err) {
      clearTimeout(timer);
      if (timeoutCtrl.signal.aborted) throw new StagingError('timeout', 'Request timed out.');
      if (req.signal?.aborted) throw new StagingError('unknown', 'Request cancelled.');
      // Network-level failure.
      throw new StagingError('offline', 'Network request failed.');
    }
    clearTimeout(timer);

    if (!res.ok) throw await mapHttpError(res);

    const json = (await res.json()) as GeminiResponse;
    const parts = json.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p) => (p.inlineData ?? p.inline_data)?.data);

    if (!imagePart) {
      const text = parts.map((p) => p.text).filter(Boolean).join(' ').trim();
      throw new StagingError('empty_result', text || 'The model returned no image.');
    }

    const inline = (imagePart.inlineData ?? imagePart.inline_data)!;
    const mime = inline.mimeType ?? inline.mime_type ?? 'image/png';
    return { imageDataUrl: `data:${mime};base64,${inline.data}` };
  }
}

async function mapHttpError(res: Response): Promise<StagingError> {
  let message = `Request failed (${res.status}).`;
  try {
    const j = (await res.json()) as GeminiResponse;
    if (j.error?.message) message = j.error.message;
  } catch {
    /* ignore parse error */
  }

  if (res.status === 401 || res.status === 403) {
    return new StagingError('invalid_key', 'Invalid or unauthorized API key.');
  }
  if (res.status === 400 && /api[_ ]?key/i.test(message)) {
    return new StagingError('invalid_key', 'Invalid API key.');
  }
  if (res.status === 429) {
    const retryAfter = Number(res.headers.get('retry-after')) * 1000 || undefined;
    // A hard cap (free tier = 0, or billing disabled) won't clear by retrying;
    // a per-minute limit will. Distinguish so the UI can guide the user.
    const isHardCap = /billing|free[_ ]?tier|limit:\s*0/i.test(message);
    return new StagingError(isHardCap ? 'quota' : 'rate_limited', message, retryAfter);
  }
  return new StagingError('unknown', message);
}

/** Abort when either signal aborts. */
function mergeSignals(a: AbortSignal | undefined, b: AbortSignal): AbortSignal {
  if (!a) return b;
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  if (a.aborted || b.aborted) ctrl.abort();
  a.addEventListener('abort', onAbort, { once: true });
  b.addEventListener('abort', onAbort, { once: true });
  return ctrl.signal;
}
