/** Validation of untrusted model output. Used on the server AND the client; AI never does arithmetic of record. */

export interface ExtractedItem {
  name: string;
  quantity: number;
  unit_price_minor: number;
  line_total_minor: number;
}
export interface ExtractedReceipt {
  merchant: string;
  date: string | null;
  currency: string;
  items: ExtractedItem[];
  subtotal_minor: number | null;
  discount_minor: number;
  tax_minor: number;
  tip_minor: number;
  total_minor: number | null;
  uncertain_fields: string[];
}
export interface ReceiptValidation {
  ok: boolean;
  receipt?: ExtractedReceipt;
  errors: string[];
  /** Non-fatal discrepancies the user must review. */
  warnings: string[];
}

const isMinor = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < 1e11;
const optMinor = (v: unknown): number | null => (v === null || v === undefined ? null : isMinor(v) ? v : NaN);

export function validateReceipt(raw: unknown): ReceiptValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, errors: ['Receipt data was not an object.'], warnings };
  const r = raw as Record<string, unknown>;
  if (!Array.isArray(r.items)) return { ok: false, errors: ['Receipt data has no item list.'], warnings };

  const items: ExtractedItem[] = [];
  r.items.forEach((it, idx) => {
    if (!it || typeof it !== 'object') return void errors.push(`Item ${idx + 1} is malformed.`);
    const o = it as Record<string, unknown>;
    const name = typeof o.name === 'string' ? o.name.trim().slice(0, 120) : '';
    const qty = typeof o.quantity === 'number' && o.quantity > 0 && o.quantity < 1000 ? o.quantity : 1;
    let unit = o.unit_price_minor;
    let line = o.line_total_minor;
    if (!isMinor(line) && isMinor(unit)) line = Math.round((unit as number) * qty);
    if (!isMinor(unit) && isMinor(line)) unit = Math.round((line as number) / qty);
    if (!isMinor(line) || !isMinor(unit)) return void errors.push(`Item ${idx + 1} ("${name || 'unnamed'}") has no readable price.`);
    if (!name) warnings.push(`Item ${idx + 1} has no readable name.`);
    items.push({ name: name || 'Unnamed item', quantity: qty, unit_price_minor: unit as number, line_total_minor: line as number });
  });
  if (items.length === 0 && errors.length === 0) errors.push('No items were found on the receipt.');

  const subtotal = optMinor(r.subtotal_minor);
  const total = optMinor(r.total_minor);
  const tax = optMinor(r.tax_minor);
  const tip = optMinor(r.tip_minor);
  const disc = optMinor(r.discount_minor);
  for (const [k, v] of [['subtotal', subtotal], ['total', total], ['tax', tax], ['tip', tip], ['discount', disc]] as const) {
    if (typeof v === 'number' && Number.isNaN(v)) errors.push(`The ${k} amount was not a valid number.`);
  }
  if (errors.length) return { ok: false, errors, warnings };

  const date = typeof r.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.date) ? r.date : null;
  if (!date) warnings.push('Receipt date could not be read.');
  const uncertain = Array.isArray(r.uncertain_fields) ? r.uncertain_fields.filter((x): x is string => typeof x === 'string').slice(0, 20) : [];

  const itemsSum = items.reduce((a, b) => a + b.line_total_minor, 0);
  if (subtotal !== null && subtotal !== itemsSum) warnings.push('Item amounts do not add up to the receipt subtotal.');
  const calc = itemsSum + (tax ?? 0) + (tip ?? 0) - (disc ?? 0);
  if (total === null) warnings.push('The receipt total could not be read. Enter it manually.');
  else if (total !== calc) warnings.push('The receipt total differs from items + tax + tip − discount.');

  return {
    ok: true,
    warnings,
    errors: [],
    receipt: {
      merchant: typeof r.merchant === 'string' ? r.merchant.trim().slice(0, 80) : '',
      date,
      currency: typeof r.currency === 'string' ? r.currency.toUpperCase().slice(0, 3) : 'INR',
      items,
      subtotal_minor: subtotal,
      discount_minor: disc ?? 0,
      tax_minor: tax ?? 0,
      tip_minor: tip ?? 0,
      total_minor: total,
      uncertain_fields: uncertain,
    },
  };
}

/** Parse the model's text into JSON safely (strips code fences). */
export function parseModelJson(text: string): unknown {
  const t = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim();
  return JSON.parse(t);
}
