import { formatMoney } from './money';

export function positionText(netMinor: number, currency = 'INR'): string {
  if (netMinor > 0) return `You're owed ${formatMoney(netMinor, currency)}`;
  if (netMinor < 0) return `You owe ${formatMoney(-netMinor, currency)}`;
  return 'All settled';
}
