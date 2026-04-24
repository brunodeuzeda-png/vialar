// Mask BR phone as user types: (11) 9xxxx-xxxx (mobile) or (11) xxxx-xxxx (landline)
export function maskBRPhone(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

// Format display from stored value (strips country code if present)
export function formatBRPhone(value: string): string {
  if (!value) return '';
  const d = value.replace(/\D/g, '');
  const local = d.startsWith('55') && d.length > 11 ? d.slice(2) : d;
  return maskBRPhone(local);
}

// Convert display format to Baileys/WhatsApp storage: 5511999999999
export function phoneToWhatsApp(value: string): string {
  const d = value.replace(/\D/g, '');
  if (!d) return '';
  const local = d.startsWith('55') ? d.slice(2) : d;
  return local ? `55${local}` : '';
}

// Convert display format to plain digits (no country code)
export function phoneToDigits(value: string): string {
  return value.replace(/\D/g, '');
}
