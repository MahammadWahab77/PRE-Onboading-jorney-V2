export function normalizeIndianPhone(phone?: string | null): string {
  if (!phone || typeof phone !== 'string') return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) return digits;
  if (digits.length === 11 && digits.startsWith('0')) {
    const trimmed = digits.slice(1);
    if (/^[6-9]\d{9}$/.test(trimmed)) return trimmed;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    const trimmed = digits.slice(2);
    if (/^[6-9]\d{9}$/.test(trimmed)) return trimmed;
  }
  const last10 = digits.slice(-10);
  if (last10.length === 10 && /^[6-9]\d{9}$/.test(last10)) return last10;
  return '';
}

export function getIndianPhoneSearchVariants(phone: string): string[] {
  const normalized = normalizeIndianPhone(phone);
  if (!normalized) return [];
  return [normalized, `+91${normalized}`, `91${normalized}`, `0${normalized}`];
}