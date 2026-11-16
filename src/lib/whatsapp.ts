import { ORDER_REF_RE } from "@/lib/manual-order";

export const SUPPORT_WHATSAPP_PHONE = "+6697-0098182";
export const OFFICE_PHONE = "+6680-5898445";
export const OFFICE_TEL_URL = "tel:+66805898445";
export const SUPPORT_WHATSAPP_URL = "https://wa.me/66970098182";

/** WhatsApp link pre-filled with the public order reference only — never a URL or access token. */
export function buildOrderWhatsAppUrl(orderNumber: string): string {
  const ref = orderNumber.trim().toUpperCase();
  if (!ORDER_REF_RE.test(ref)) return SUPPORT_WHATSAPP_URL;
  return `${SUPPORT_WHATSAPP_URL}?text=${encodeURIComponent(`Hi Kopi Malay, I have a question regarding my order ${ref}.`)}`;
}
