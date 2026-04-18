/**
 * Parse a date string (YYYY-MM-DD) as local noon time to avoid
 * UTC midnight timezone shift (P2-2 fix for Pakistan UTC+5).
 *
 * Without this: new Date("2010-05-15") → UTC midnight → shows May 14 in PST
 * With this: parseLocalDate("2010-05-15") → local noon → shows May 15 correctly
 */
export function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  // Already a Date object
  // Note: at runtime dateStr could be Date if caller passes a Date object
  if (typeof dateStr === 'object') return dateStr as unknown as Date;
  // ISO string with time component — parse as-is
  if (dateStr.includes('T')) return new Date(dateStr);
  // Date-only string: parse as local noon to avoid timezone drift
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return new Date(dateStr);
  return new Date(y, m - 1, d, 12, 0, 0);
}

/**
 * Convert a YYYY-MM monthYear label to standard format.
 * Handles "January 2025" → "2025-01" conversion (P1-4 payroll fix).
 */
export function normalizeMonthYear(input: string): string | null {
  if (!input) return null;
  // Already in YYYY-MM format
  if (/^\d{4}-\d{2}$/.test(input)) return input;
  // "January 2025" format
  const months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  const parts = input.split(' ');
  if (parts.length === 2) {
    const mIdx = months.indexOf(parts[0]);
    if (mIdx >= 0) {
      return `${parts[1]}-${String(mIdx + 1).padStart(2, '0')}`;
    }
  }
  return null;
}
