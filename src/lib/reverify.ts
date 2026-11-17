/** Browser-safe helpers for the "Order Re-verified" Telegram alert. */
export type HistoryStep = { from_status: string | null; to_status: string };

/** True when the order was verified before and an owner undid it (verified -> pending_verification). */
export function wasUndoneBefore(history: HistoryStep[]): boolean {
  return history.some((h) => h.from_status === "verified" && h.to_status === "pending_verification");
}

export function buildReverifyAlert(o: { orderNumber: string; actorEmail: string; actorRole: string | null; customer: string; country: string; total: string; receipt: string | null; at: Date }, esc: (s: string) => string): string {
  return [
    `🔄 <b>Order Re-verified: ${esc(o.orderNumber)}</b>`,
    `• By: ${esc(o.actorEmail)}${o.actorRole ? ` (${esc(o.actorRole)})` : ""}`,
    `• Customer: ${esc(o.customer)}${o.country ? ` (${esc(o.country)})` : ""}`,
    `• Total: ${esc(o.total)}`,
    o.receipt ? `• POS sale receipt: ${esc(o.receipt)}` : null,
    `• Time: ${o.at.toLocaleString("en-GB", { timeZone: "Asia/Bangkok" })}`,
    `• Note: this order was verified before and undone by the owner.`,
  ].filter(Boolean).join("\n");
}
