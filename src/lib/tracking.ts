/** Browser-safe courier tracking helpers shared by profile, order status, lookup and shipped emails. */

export type Courier = { id: "jnt" | "flash"; name: string; trackUrl: (trackingNumber: string) => string };

const JNT: Courier = { id: "jnt", name: "J&T Express", trackUrl: (n) => `https://www.jtexpress.my/tracking/${encodeURIComponent(n)}` };
const FLASH: Courier = { id: "flash", name: "Flash Express", trackUrl: (n) => `https://www.flashexpress.co.th/en/fle/tracking?se=${encodeURIComponent(n)}` };

/** Malaysia ships with J&T, Thailand with Flash. Destination country wins; currency is the fallback for older rows. */
export function courierFor(order: { country?: string | null | undefined; currency?: string | null | undefined }): Courier {
  const c = (order.country ?? "").trim().toLowerCase();
  if (c === "thailand") return FLASH;
  if (c === "malaysia") return JNT;
  return (order.currency ?? "").toLowerCase() === "thb" ? FLASH : JNT;
}

export type TrackingInfo = { courier: string; trackingNumber: string; url: string };

/** Tracking link details, or null when the order has no tracking number yet. */
export function trackingInfo(order: { country?: string | null | undefined; currency?: string | null | undefined; tracking_number?: string | null | undefined }): TrackingInfo | null {
  const n = order.tracking_number?.trim();
  if (!n) return null;
  const courier = courierFor(order);
  return { courier: courier.name, trackingNumber: n, url: courier.trackUrl(n) };
}

export type TrackingStage = "checking" | "preparing" | "shipped" | "delivered" | "closed";

/** Which tracking message the customer sees for an order status. */
export function trackingStage(status: string): TrackingStage {
  if (status === "verified") return "preparing";
  if (status === "shipped") return "shipped";
  if (status === "completed") return "delivered";
  if (status === "rejected" || status === "refunded") return "closed";
  return "checking";
}

/** Customer-facing next-step wording for orders that are not yet trackable. */
export function trackingHint(status: string, courierName: string): string | null {
  switch (trackingStage(status)) {
    case "checking": return "We'll email your tracking number";
    case "preparing": return "We'll email your tracking number";
    default: return null;
  }
}
