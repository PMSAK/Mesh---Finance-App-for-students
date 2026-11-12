import { describe, expect, it } from 'vitest';
import { handleScan } from '../../server/receiptApi';

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]).toString('base64');
const payload = { mimeType: 'image/jpeg', dataBase64: jpeg };
const gem = (text: string, ok = true, status = 200) => (async () => ({ ok, status, json: async () => ({ choices: [{ message: { content: text } }], candidates: [{ content: { parts: [{ text }] } }] }) }) as Response) as unknown as typeof fetch;

describe('receipt API handler', () => {
  it('reports not configured without a key (fallback path)', async () => {
    const r = await handleScan(payload, {});
    expect(r.status).toBe(503);
    expect(r.body.error).toBe('not_configured');
  });
  it('rejects unsupported types, bad signatures and empty bodies', async () => {
    expect((await handleScan({ mimeType: 'application/pdf', dataBase64: jpeg }, { apiKey: 'k' })).status).toBe(415);
    expect((await handleScan({ mimeType: 'image/png', dataBase64: jpeg }, { apiKey: 'k' })).status).toBe(415);
    expect((await handleScan({ mimeType: 'image/jpeg', dataBase64: '' }, { apiKey: 'k' })).status).toBe(413);
    expect((await handleScan(null, { apiKey: 'k' })).status).toBe(400);
  });
  it('returns validated receipt for good provider output', async () => {
    const good = JSON.stringify({ merchant: 'Cafe', items: [{ name: 'Tea', quantity: 1, unit_price_minor: 5000, line_total_minor: 5000 }], total_minor: 5000 });
    const r = await handleScan(payload, { apiKey: 'k', fetchImpl: gem(good) });
    expect(r.status).toBe(200);
    expect((r.body.receipt as { items: unknown[] }).items.length).toBe(1);
  });
  it('rejects malformed JSON and invalid schema from the provider', async () => {
    expect((await handleScan(payload, { apiKey: 'k', fetchImpl: gem('oops') })).status).toBe(422);
    expect((await handleScan(payload, { apiKey: 'k', fetchImpl: gem('{"items":[{"name":"x","line_total_minor":-5}]}') })).status).toBe(422);
  });
  it('maps provider errors, rate limits and timeouts', async () => {
    expect((await handleScan(payload, { apiKey: 'k', fetchImpl: gem('', false, 500) })).status).toBe(502);
    expect((await handleScan(payload, { apiKey: 'k', fetchImpl: gem('', false, 429) })).status).toBe(429);
    const hang = ((_u: unknown, init: RequestInit) => new Promise((_res, rej) => init.signal!.addEventListener('abort', () => rej(Object.assign(new Error('a'), { name: 'AbortError' }))))) as unknown as typeof fetch;
    expect((await handleScan(payload, { apiKey: 'k', fetchImpl: hang, timeoutMs: 20 })).status).toBe(504);
  });
});
