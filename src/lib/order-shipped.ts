import { trackingInfo } from "./tracking";

/** Order fields needed for the "your order has shipped" email. Recipient is always the order's own checkout email. */
export type ShippedOrder = {
  id: string; order_number: string; guest_email: string | null; currency: string; access_token: string | null;
  shipping_address: { name?: string; full_name?: string; country?: string } | null;
  order_items: { product_name: string; selected_variant: string | null; quantity: number }[] | null;
};

export const STATUS_LINK_BASE = "https://kopimalay.com/order-success";

/** Builds recipient, template data and a per-tracking-number idempotency key, or null when there's nobody/nothing to send. */
export function buildShippedEmail(o: ShippedOrder, trackingNumber: string, corrected: boolean) {
  const to = o.guest_email?.trim();
  const info = trackingInfo({ country: o.shipping_address?.country, currency: o.currency, tracking_number: trackingNumber });
  if (!to || !info) return null;
  const items = (o.order_items ?? []).slice(0, 8).map((i) => `${i.product_name}${i.selected_variant ? ` (Size ${i.selected_variant})` : ""} × ${i.quantity}`);
  const more = Math.max(0, (o.order_items?.length ?? 0) - items.length);
  return {
    to,
    idempotencyKey: `order-shipped-${o.id}-${info.trackingNumber}`,
    templateData: {
      name: o.shipping_address?.name ?? o.shipping_address?.full_name ?? "",
      orderNumber: o.order_number, courier: info.courier, trackingNumber: info.trackingNumber, trackUrl: info.url,
      statusLink: o.access_token ? `${STATUS_LINK_BASE}?ref=${encodeURIComponent(o.order_number)}&t=${o.access_token}` : "",
      items: more ? [...items, `+${more} more item${more === 1 ? "" : "s"}`] : items,
      corrected,
    },
  };
}
