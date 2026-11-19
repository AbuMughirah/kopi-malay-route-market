import { z } from "zod";

/** Browser-safe rules for the public "Track my order" request (order number + checkout email). */
export const LOOKUP_LIMITS = { perClient: 10, perEmail: 10, perOrder: 5, sendsPerOrder: 3, windowMs: 3600_000 } as const;
/** Same reply whether or not the details match, so the form never confirms which orders or emails exist. */
export const LOOKUP_SENT = "If that order number matches the email you used at checkout, we've just emailed you a private link to your order status and tracking. It can take a few minutes — check your spam folder too.";
export const LOOKUP_LIMITED = "Too many attempts. Please wait an hour and try again, or open the status link in your order confirmation email.";

/** Accepts "KM-12345", "km 12345" or just "12345". */
export function normalizeOrderRef(input: string): string {
  const digits = input.trim().toUpperCase().replace(/^KM[\s-]*/, "");
  return /^\d{5}$/.test(digits) ? `KM-${digits}` : input.trim().toUpperCase();
}

export const OrderLookupSchema = z.object({
  ref: z.string().trim().max(20).transform(normalizeOrderRef).pipe(z.string().regex(/^KM-\d{5}$/, "Enter your order number, e.g. KM-12345.")),
  email: z.string().trim().toLowerCase().email("Enter the email you used at checkout.").max(254),
});

/** Failed attempts in the last hour; any limit reached blocks the lookup before the order is read. */
export function lookupBlocked(f: { client: number | null; email: number; order: number }): boolean {
  return (f.client !== null && f.client >= LOOKUP_LIMITS.perClient) || f.email >= LOOKUP_LIMITS.perEmail || f.order >= LOOKUP_LIMITS.perOrder;
}

/** Case-insensitive comparison with the order's saved checkout email. */
export const emailMatches = (saved: string | null | undefined, entered: string) => !!saved && saved.trim().toLowerCase() === entered.trim().toLowerCase();

/** A link is emailed only when the details match, the order has a private token, and the hourly send cap isn't reached. */
export function shouldSendTrackingLink(f: { matched: boolean; hasToken: boolean; recentSends: number }): boolean {
  return f.matched && f.hasToken && f.recentSends < LOOKUP_LIMITS.sendsPerOrder;
}

/** The lookup never returns order details; it only reports that the request was handled (or rate-limited). */
export type LookupResult = { ok: true; message: string } | { ok: false; message: string };
