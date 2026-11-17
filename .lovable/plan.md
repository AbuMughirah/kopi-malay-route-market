# Batch 2: Combined Shipping, Re-verification Alert, Customer Size Exchange

Your project rules say shipping, stock and receipt changes need plan approval first, so nothing is built yet.

## 1. Combined accessory shipping (Malaysia only)
- Every 1 apparel or tumbler unit gives 20 free accessory units.
- Accessories above that allowance are charged RM 20 per started block of 20.
- Apparel and tumbler blocks stay as today (RM 20 per 2). Sabah/Sarawak RM 10 stays once per order. Thailand unchanged.
- Client examples:
  - 1 shirt + 20 stickers = RM 20
  - 2 shirts + 40 stickers = RM 20
  - 3 shirts + 61 stickers = RM 40 + RM 20 = RM 60
  - 20 stickers only = RM 20 (no allowance)
- Checkout breakdown shows "Accessories: X included free, Y charged". Same helper on checkout and server, so totals always match.
- Product page shipping text updated to explain the allowance.

## 2. Telegram "Order Re-verified" alert
- When an order is verified and its history shows an earlier Undo Verify, send "Order Re-verified" with order number, staff, customer, total, POS receipt and time.
- Alert never blocks verification if Telegram is down.

## 3. Customer size exchange in My Profile
- "Change size" button on order cards, only for apparel, only while Pending Verification. Hidden once verified or later.
- Pick new size; sold-out sizes are disabled; server re-checks stock, ownership and status.
- No money changes hands; same price, same total.
- Saves an audit entry in order history and sends a Telegram "Size change" alert.

## Gaps and trade-offs
| Risk | Mitigation |
|---|---|
| Verified orders already have a Loyverse sale for the old size. Changing size then makes Loyverse stock wrong. | Limit self-service to Pending Verification. For verified orders, show the WhatsApp button so staff do Undo Verify, change, re-verify. |
| Two customers grab the last size at once | Pending orders do not reserve stock today; verification still checks real stock and blocks shortfalls. |
| Repeated size flip-flopping | Max 2 size changes per order. |
| Existing tests expect old accessory charges (e.g. 3 shirts + 2 tumblers + 21 stickers = RM 100) | Tests updated to new rule: that becomes RM 60. |

## Technical details
- `src/lib/shop.ts`: allowance in `malaysiaShippingBreakdown`; `shippingDescription` text.
- `src/routes/checkout.index.tsx`: accessory breakdown line.
- `src/lib/admin.functions.ts`: re-verify alert after successful verify.
- New `src/lib/customer-exchange.functions.ts`: `requestSizeExchange` (auth, ownership, pending only, apparel only, stock check, 2-change cap, history row via service client, Telegram).
- Migration: service-only SQL function to update the item size and append history in one transaction.
- `src/routes/_authenticated/profile.tsx`: button + size dialog.
- Tests: shipping examples, re-verify detection, exchange rules.

## Billable estimate
- ~7-8.5 hours, market value RM 1,800-2,400 (THB 14,400-19,200).
- Shipping + alert: scope adjustment under SLA. Size exchange: out-of-scope add-on.
