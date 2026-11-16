import { z } from "zod";

/** Browser-safe rules for the public "Track my order" lookup (order number + checkout email). */
export const LOOKUP_LIMITS = { perClient: 10, perEmail: 10, perOrder: 5, windowMs: 3600_000 } as const;
export const LOOKUP_NOT_FOUND = "We couldn't find an order with that order number and email. Check both and try again — use the email you entered at checkout.";
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

export type LookupOrder = {
  order_number: string; created_at: string; status: string; currency: string; country: string | null; tracking_number: string | null;
  items: { product_name: string; selected_variant: string | null; quantity: number }[];
};
export type LookupResult = { ok: true; order: LookupOrder } | { ok: false; message: string };
