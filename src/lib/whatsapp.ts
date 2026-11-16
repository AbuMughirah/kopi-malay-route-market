import { ORDER_REF_RE } from "@/lib/manual-order";

export const SUPPORT_WHATSAPP_PHONE = "+66 97 009 8182";
export const SUPPORT_WHATSAPP_URL = "https://wa.me/66970098182";

/** WhatsApp link pre-filled with the public order reference only — never a URL or access token. */
export function buildOrderWhatsAppUrl(orderNumber: string): string {
  const ref = orderNumber.trim().toUpperCase();
  if (!ORDER_REF_RE.test(ref)) return SUPPORT_WHATSAPP_URL;
  return `${SUPPORT_WHATSAPP_URL}?text=${encodeURIComponent(`Hi Kopi Malay, I have a question regarding my order ${ref}.`)}`;
}
