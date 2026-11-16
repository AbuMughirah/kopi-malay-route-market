/** Browser-safe helpers for the owner-only customer purchase history in Admin → Users. */
export const VERIFIED_ORDER_STATUSES = ["verified", "shipped", "received", "completed"] as const;
export const isVerifiedOrder = (status: string) => (VERIFIED_ORDER_STATUSES as readonly string[]).includes(status);

type OrderRef = { user_id: string | null; guest_email: string | null; status: string };
export type OrderSource = "member" | "guest_email";

/** Member orders belong by account; guest checkouts only match by email when no account is attached. */
export function orderSource(o: { user_id: string | null; guest_email: string | null }, user: { id: string; email: string }): OrderSource | null {
  if (o.user_id === user.id) return "member";
  if (!o.user_id && user.email && o.guest_email?.trim().toLowerCase() === user.email.trim().toLowerCase()) return "guest_email";
  return null;
}

export function countVerifiedOrders(orders: OrderRef[], user: { id: string; email: string }) {
  return orders.filter((o) => isVerifiedOrder(o.status) && orderSource(o, user)).length;
}

/** Lifetime spend per currency from verified orders only; currencies are never combined. */
export function lifetimeSpend(orders: { status: string; currency: string; total_amount: number }[]) {
  const out = { myr: 0, thb: 0, myrOrders: 0, thbOrders: 0 };
  for (const o of orders) {
    if (!isVerifiedOrder(o.status)) continue;
    const cents = Math.round(o.total_amount * 100);
    if (o.currency.toLowerCase() === "thb") { out.thb += cents; out.thbOrders++; } else { out.myr += cents; out.myrOrders++; }
  }
  return { ...out, myr: out.myr / 100, thb: out.thb / 100 };
}
