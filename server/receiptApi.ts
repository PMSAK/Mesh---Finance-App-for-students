import type { IncomingMessage, ServerResponse } from 'node:http';
import { parseModelJson, validateReceipt } from '../src/lib/receipt.ts';

export interface ReceiptApiOptions {
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
  /** Injected for tests. */
  fetchImpl?: typeof fetch;
}

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_BYTES = 6 * 1024 * 1024;

const PROMPT = `You extract data from a photographed receipt or payment screenshot.
Return ONLY JSON matching the schema. All money values are INTEGER minor units (paise): ₹120.50 => 12050.
Rules: never invent values. If a field is unreadable, use null (or omit) and add its name to uncertain_fields.
Do not do any adjustments or recalculation: copy numbers as printed. quantity defaults to 1.`;

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    merchant: { type: 'STRING', nullable: true },
    date: { type: 'STRING', nullable: true, description: 'YYYY-MM-DD' },
    currency: { type: 'STRING', nullable: true },
    items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          quantity: { type: 'NUMBER', nullable: true },
          unit_price_minor: { type: 'INTEGER', nullable: true },
          line_total_minor: { type: 'INTEGER', nullable: true },
        },
        required: ['name'],
      },
    },
    subtotal_minor: { type: 'INTEGER', nullable: true },
    discount_minor: { type: 'INTEGER', nullable: true },
    tax_minor: { type: 'INTEGER', nullable: true },
    tip_minor: { type: 'INTEGER', nullable: true },
    total_minor: { type: 'INTEGER', nullable: true },
    uncertain_fields: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['items'],
};

export interface ScanOutcome {
  status: number;
  body: Record<string, unknown>;
}

/** Magic-byte check for formats we can verify cheaply. */
function signatureOk(mime: string, buf: Buffer): boolean {
  if (mime === 'image/jpeg') return buf[0] === 0xff && buf[1] === 0xd8;
  if (mime === 'image/png') return buf.subarray(0, 4).toString('hex') === '89504e47';
  if (mime === 'image/webp') return buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP';
  return true;
}

export async function handleScan(payload: unknown, opts: ReceiptApiOptions): Promise<ScanOutcome> {
  if (!opts.apiKey) {
    return { status: 503, body: { error: 'not_configured', message: 'Receipt scanning needs OPENAI_API_KEY on the server. You can still enter the items manually.' } };
  }
  const p = payload as { mimeType?: unknown; dataBase64?: unknown } | null;
  if (!p || typeof p.mimeType !== 'string' || typeof p.dataBase64 !== 'string') {
    return { status: 400, body: { error: 'bad_request', message: 'Send an image to scan.' } };
  }
  if (!ALLOWED.includes(p.mimeType)) return { status: 415, body: { error: 'unsupported_type', message: 'Use a JPG, PNG, WebP or HEIC image.' } };
  const buf = Buffer.from(p.dataBase64, 'base64');
  if (buf.length === 0 || buf.length > MAX_BYTES) return { status: 413, body: { error: 'too_large', message: 'That image is empty or larger than 6 MB.' } };
  if (!signatureOk(p.mimeType, buf)) return { status: 415, body: { error: 'unsupported_type', message: "That file doesn't look like a valid image." } };

  const isGemini = opts.apiKey.startsWith('AIza') || (opts.model && opts.model.startsWith('gemini'));
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), opts.timeoutMs ?? 30000);
  try {
    let res: Response;
    if (isGemini) {
      const model = opts.model || 'gemini-2.5-flash';
      res = await (opts.fetchImpl ?? fetch)(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        signal: ctl.signal,
        headers: { 'content-type': 'application/json', 'x-goog-api-key': opts.apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: PROMPT }, { inlineData: { mimeType: p.mimeType, data: p.dataBase64 } }] }],
          generationConfig: { responseMimeType: 'application/json', responseSchema: SCHEMA, temperature: 0 },
        }),
      });
    } else {
      const model = opts.model || 'gpt-4o-mini';
      res = await (opts.fetchImpl ?? fetch)('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        signal: ctl.signal,
        headers: {
          'content-type': 'application/json',
          'authorization': `Bearer ${opts.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: `${PROMPT}\nReturn ONLY a JSON object with: merchant, date (YYYY-MM-DD), currency, items (array of { name, quantity, unit_price_minor, line_total_minor }), subtotal_minor, discount_minor, tax_minor, tip_minor, total_minor, uncertain_fields.`,
            },
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Extract all data from this receipt into the required JSON schema.' },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${p.mimeType};base64,${p.dataBase64}`,
                  },
                },
              ],
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0,
        }),
      });
    }

    if (res.status === 429) return { status: 429, body: { error: 'rate_limited', message: 'The scanner is busy right now. Try again in a minute or enter items manually.' } };
    if (!res.ok) {
      let errDetail = '';
      try {
        const errJson = (await res.json()) as { error?: { message?: string } };
        errDetail = errJson?.error?.message ? ` (${errJson.error.message})` : '';
      } catch {
        /* ignore */
      }
      return { status: 502, body: { error: 'provider_error', message: `We couldn't read this receipt clearly${errDetail}. You can correct the details or enter them manually.` } };
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text =
      json.choices?.[0]?.message?.content ??
      json.candidates?.[0]?.content?.parts?.map((x) => x.text ?? '').join('') ??
      '';
    let parsed: unknown;
    try {
      parsed = parseModelJson(text);
    } catch {
      return { status: 422, body: { error: 'malformed', message: "The scanner's answer wasn't usable. You can enter the items manually." } };
    }
    const v = validateReceipt(parsed);
    if (!v.ok) return { status: 422, body: { error: 'invalid_receipt', message: v.errors.join(' '), errors: v.errors } };
    return { status: 200, body: { receipt: v.receipt, warnings: v.warnings } };
  } catch (e) {
    const timeout = (e as Error)?.name === 'AbortError';
    return { status: timeout ? 504 : 502, body: { error: timeout ? 'timeout' : 'network', message: timeout ? 'Reading the receipt took too long. Try again or enter items manually.' : "Couldn't reach the scanner. Try again or enter items manually." } };
  } finally {
    clearTimeout(timer);
  }
}

function readBody(req: IncomingMessage, limit: number): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > limit) {
        reject(new Error('too_large'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new Error('bad_json'));
      }
    });
    req.on('error', reject);
  });
}

const send = (res: ServerResponse, status: number, body: unknown) => {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(body));
};

/** Connect-style middleware shared by dev and preview servers. Images are never stored. */
export function receiptMiddleware(opts: ReceiptApiOptions) {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = (req.url ?? '').split('?')[0];
    if (url === '/api/scan/status' && req.method === 'GET') return send(res, 200, { configured: Boolean(opts.apiKey) });
    if (url !== '/api/scan') return next();
    if (req.method !== 'POST') return send(res, 405, { error: 'method', message: 'Use POST.' });
    try {
      const body = await readBody(req, Math.ceil(MAX_BYTES * 1.4) + 1024);
      const out = await handleScan(body, opts);
      send(res, out.status, out.body);
    } catch (e) {
      const tooLarge = (e as Error).message === 'too_large';
      send(res, tooLarge ? 413 : 400, { error: tooLarge ? 'too_large' : 'bad_request', message: tooLarge ? 'That image is larger than 6 MB.' : 'Send an image to scan.' });
    }
  };
}
