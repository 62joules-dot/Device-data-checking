// wa.me needs the international number, digits only, no leading "+" or "00".
// A 10-digit number starting with 0 is assumed French.
export function toWhatsAppNumber(phone: string | null | undefined) {
  let digits = (phone ?? "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith("0")) digits = "33" + digits.slice(1);
  return digits;
}

export function whatsAppLink(phone: string | null | undefined, text: string) {
  const n = toWhatsAppNumber(phone);
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}
