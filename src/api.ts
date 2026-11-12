import type { ExtractedReceipt } from './lib/receipt';

export interface ScanOk { receipt: ExtractedReceipt; warnings: string[] }
export class ScanError extends Error {
  constructor(message: string, public code: string) { super(message); }
}

export async function scanStatus(): Promise<boolean> {
  try {
    const r = await fetch('/api/scan/status');
    if (!r.ok) return false;
    return Boolean((await r.json()).configured);
  } catch { return false; }
}

/** Downscale large photos client-side (smaller upload, faster scan). Falls back to the original file. */
async function prepare(file: File): Promise<{ mimeType: string; dataBase64: string }> {
  const toB64 = (b: Blob) => new Promise<string>((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result).split(',')[1] ?? '');
    fr.onerror = () => rej(new Error('read'));
    fr.readAsDataURL(b);
  });
  try {
    if (file.type !== 'image/heic' && file.type !== 'image/heif' && typeof createImageBitmap === 'function') {
      const bmp = await createImageBitmap(file);
      const scale = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
      const c = document.createElement('canvas');
      c.width = Math.round(bmp.width * scale);
      c.height = Math.round(bmp.height * scale);
      c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
      const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/jpeg', 0.85));
      if (blob) return { mimeType: 'image/jpeg', dataBase64: await toB64(blob) };
    }
  } catch { /* use original */ }
  return { mimeType: file.type, dataBase64: await toB64(file) };
}

/** Sends the image to OUR server route (never directly to OpenAI; the key never reaches the browser). */
export async function scanReceipt(file: File, signal?: AbortSignal): Promise<ScanOk> {
  const body = await prepare(file);
  let res: Response;
  try {
    res = await fetch('/api/scan', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw new ScanError('Scan cancelled.', 'cancelled');
    throw new ScanError("Couldn't reach the scanner. Check your connection or enter the items manually.", 'network');
  }
  const json = (await res.json().catch(() => ({}))) as { receipt?: ExtractedReceipt; warnings?: string[]; message?: string; error?: string };
  if (!res.ok || !json.receipt) throw new ScanError(json.message ?? "We couldn't read this receipt clearly. You can correct the details or enter them manually.", json.error ?? 'failed');
  return { receipt: json.receipt, warnings: json.warnings ?? [] };
}

export interface CoachRecommendation {
  id: string;
  category: 'spending' | 'runway' | 'commitments' | 'shared';
  title: string;
  advice: string;
  impact: string;
}

export interface CoachAnalysis {
  summary: string;
  verdict: 'comfortable' | 'caution' | 'at_risk';
  recommendations: CoachRecommendation[];
  generatedAt: string;
}

export class CoachError extends Error {
  constructor(message: string, public code: string) { super(message); }
}

export async function coachStatus(): Promise<boolean> {
  try {
    const r = await fetch('/api/coach/status');
    if (!r.ok) return false;
    return Boolean((await r.json()).configured);
  } catch { return false; }
}

export async function requestCoachAnalysis(payload: unknown, signal?: AbortSignal): Promise<CoachAnalysis> {
  let res: Response;
  try {
    res = await fetch('/api/coach', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw new CoachError('Analysis cancelled.', 'cancelled');
    throw new CoachError("Couldn't connect to Money Coach. Check your connection or server status.", 'network');
  }
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; analysis?: CoachAnalysis; message?: string; error?: string };
  if (!res.ok || !json.analysis) {
    throw new CoachError(json.message ?? 'Money Coach analysis could not be completed.', json.error ?? 'failed');
  }
  return json.analysis;
}

