import { z } from "zod";
import type { PlacedBy } from "./roles";

export const INCOME_SALES = ["verified", "shipped", "received", "completed"];
export const IncomeFiltersSchema = z.object({
  from: z.string().date().optional(), to: z.string().date().optional(),
  currency: z.enum(["all", "myr", "thb"]).default("all"),
  category: z.string().max(120).default(""), product: z.string().max(200).default(""),
  promo: z.string().max(120).default(""), sale: z.enum(["all", "sale", "regular"]).default("all"),
  pipeline: z.boolean().default(false), view: z.enum(["products", "categories", "promos", "time", "ledger"]).default("products"),
  period: z.enum(["day", "month", "year"]).default("month"),
}).refine((f) => !f.from || !f.to || f.from <= f.to, { message: "Start date must be before end date" });
export type IncomeFilters = z.infer<typeof IncomeFiltersSchema>;
export type IncomeItem = { id: string; product_id: string | null; product_name: string; selected_variant: string; quantity: number; unit_price: number; category: string; category_slug: string };
export type IncomeOrder = { id: string; order_number: string; created_at: string; status: string; pre_claim_status: string | null; currency: string; subtotal: number; sale_discount: number; sticker_bundle_discount: number; discount_amount: number; shipping_fee: number; total_amount: number; promo_code: string | null; payment_method: string; placed_by: PlacedBy | null; items: IncomeItem[] };
export type Metric = { orders: number; units: number; gross: number; sale: number; bundle: number; promo: number; merch: number; shipping: number; inflow: number; refunds: number; refundOrders: number; pending: number };
const empty = (): Metric => ({ orders: 0, units: 0, gross: 0, sale: 0, bundle: 0, promo: 0, merch: 0, shipping: 0, inflow: 0, refunds: 0, refundOrders: 0, pending: 0 });
export const cents = (n: number) => Math.round(Number(n) * 100);
export const bangkokDay = (iso: string) => new Date(new Date(iso).getTime() + 7 * 3600_000).toISOString().slice(0, 10);
export type DatePreset = "today" | "yesterday" | "week" | "month" | "last-month" | "year" | "all" | "custom";
export function incomeDates(preset: DatePreset, now = new Date()): { from?: string; to?: string } {
  const day = bangkokDay(now.toISOString()), d = new Date(`${day}T00:00:00Z`);
  if (preset === "all" || preset === "custom") return {};
  if (preset === "yesterday") { d.setUTCDate(d.getUTCDate() - 1); return { from: d.toISOString().slice(0, 10), to: d.toISOString().slice(0, 10) }; }
  if (preset === "week") d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7);
  if (preset === "month") d.setUTCDate(1);
  if (preset === "year") { d.setUTCMonth(0, 1); }
  if (preset === "last-month") { d.setUTCDate(1); d.setUTCDate(0); const to = d.toISOString().slice(0, 10); d.setUTCDate(1); return { from: d.toISOString().slice(0, 10), to }; }
  return { from: d.toISOString().slice(0, 10), to: day };
}
/** Largest-remainder allocation in minor units; the sum is always exact. */
export function allocate(amount: number, weights: number[]): number[] {
  const total = weights.reduce((s, w) => s + Math.max(0, w), 0);
  if (!total) return weights.map((_, i) => i === 0 ? amount : 0);
  const raw = weights.map((w) => amount * Math.max(0, w) / total), result = raw.map(Math.floor);
  const sorted = raw.map((v, i) => ({ i, fraction: v - (result[i] ?? 0) })).sort((a, b) => b.fraction - a.fraction || a.i - b.i);
  for (let n = amount - result.reduce((s, v) => s + v, 0), i = 0; i < n; i++) { const entry = sorted[i % sorted.length]; if (entry) result[entry.i] = (result[entry.i] ?? 0) + 1; };
  return result;
}
export function incomeLines(o: IncomeOrder) {
  const weights = o.items.map((i) => cents(i.unit_price) * i.quantity);
  const priced = allocate(cents(o.subtotal), weights);
  const sale = allocate(cents(o.sale_discount), weights);
  const eligible = o.items.map((i, n) => i.category_slug === "stickers" && i.product_name.startsWith("STICKER (8x8cm)") ? (priced[n] ?? 0) : 0);
  const bundle = allocate(cents(o.sticker_bundle_discount), eligible.some(Boolean) ? eligible : weights);
  const promo = allocate(cents(o.discount_amount), priced.map((v, n) => Math.max(0, v - (bundle[n] ?? 0))));
  // Saved paid totals are authoritative, even when historical fields are incomplete.
  const net = allocate(cents(o.total_amount) - cents(o.shipping_fee), priced.map((v, n) => Math.max(0, v - (bundle[n] ?? 0) - (promo[n] ?? 0))));
  return o.items.map((item, i) => ({ ...item, gross: (priced[i] ?? 0) + (sale[i] ?? 0), sale: sale[i] ?? 0, bundle: bundle[i] ?? 0, promo: promo[i] ?? 0, net: net[i] ?? 0 }));
}
export type Breakdown = { key: string; label: string; detail: string; currency: "myr" | "thb"; units: number; orders: number; gross: number; sale: number; bundle: number; promo: number; net: number; refunds: number; share: number };
export type Ledger = { reference: string; date: string; status: string; placedBy: PlacedBy | null; items: string; currency: string; gross: number; sale: number; bundle: number; promo: number; merch: number; shipping: number; paid: number; realized: number; refunded: number; payment: string; promoCode: string };
export function buildIncomeReport(input: IncomeOrder[], f: IncomeFilters) {
  const recognized = (o: IncomeOrder) => INCOME_SALES.includes(o.status === "reversing" ? o.pre_claim_status ?? "" : o.status);
  const eligible = input.filter((o) => {
    const day = bangkokDay(o.created_at);
    return ["myr", "thb"].includes(o.currency.toLowerCase()) && (!f.from || day >= f.from) && (!f.to || day <= f.to)
      && (f.currency === "all" || o.currency.toLowerCase() === f.currency)
      && (!f.category || o.items.some((i) => i.category_slug === f.category))
      && (!f.product || o.items.some((i) => `${i.product_name} ${i.selected_variant}`.toLowerCase().includes(f.product.toLowerCase())))
      && (!f.promo || (f.promo === "__with" ? !!o.promo_code : f.promo === "__without" ? !o.promo_code : o.promo_code === f.promo))
      && (f.sale === "all" || (f.sale === "sale" ? Number(o.sale_discount) > 0 : Number(o.sale_discount) === 0));
  });
  const rows = eligible.filter((o) => f.pipeline || recognized(o) || o.status === "refunded");
  const totals = { myr: empty(), thb: empty() }, groups = new Map<string, Breakdown>(), groupOrders = new Map<string, Set<string>>();
  let warnings = 0;
  const ledger: Ledger[] = [];
  for (const o of rows) {
    const currency = o.currency.toLowerCase() as "myr" | "thb", t = totals[currency], real = recognized(o), refund = o.status === "refunded";
    const paid = cents(o.total_amount), shipping = cents(o.shipping_fee), merch = paid - shipping, sale = cents(o.sale_discount), bundle = cents(o.sticker_bundle_discount), promo = cents(o.discount_amount), gross = cents(o.subtotal) + sale;
    if (cents(o.subtotal) - bundle - promo + shipping !== paid || !o.items.length) warnings++;
    if (real) { t.orders++; t.units += o.items.reduce((s, i) => s + i.quantity, 0); t.gross += gross; t.sale += sale; t.bundle += bundle; t.promo += promo; t.merch += merch; t.shipping += shipping; t.inflow += paid; }
    else if (refund) { t.refunds += paid; t.refundOrders++; }
    else if (!["rejected", "refunded"].includes(o.status)) t.pending += paid;
    ledger.push({ reference: o.order_number, date: bangkokDay(o.created_at), status: o.status, placedBy: o.placed_by, items: o.items.map((i) => `${i.quantity} × ${i.product_name}${i.selected_variant ? ` (${i.selected_variant})` : ""}`).join("; "), currency, gross, sale, bundle, promo, merch, shipping, paid, realized: real ? paid : 0, refunded: refund ? paid : 0, payment: o.payment_method, promoCode: o.promo_code ?? "" });
    if (!real && !refund) continue;
    for (const line of incomeLines(o)) {
      let label = line.product_name, detail = line.selected_variant, key = `${line.product_id ?? line.product_name}:${detail}`;
      if (f.view === "categories") { label = line.category; detail = ""; key = line.category_slug; }
      if (f.view === "promos") { label = o.promo_code ?? "No promo"; detail = ""; key = label; }
      if (f.view === "time") { label = bangkokDay(o.created_at).slice(0, f.period === "year" ? 4 : f.period === "month" ? 7 : 10); detail = ""; key = label; }
      key = `${currency}:${key}`;
      const g = groups.get(key) ?? { key, label, detail, currency, units: 0, orders: 0, gross: 0, sale: 0, bundle: 0, promo: 0, net: 0, refunds: 0, share: 0 };
      if (real) { g.units += line.quantity; g.gross += line.gross; g.sale += line.sale; g.bundle += line.bundle; g.promo += line.promo; g.net += line.net; const ids = groupOrders.get(key) ?? new Set(); ids.add(o.id); groupOrders.set(key, ids); g.orders = ids.size; }
      if (refund) g.refunds += line.net;
      groups.set(key, g);
    }
  }
  const breakdown = [...groups.values()].map((g) => ({ ...g, share: totals[g.currency].merch > 0 ? g.net / totals[g.currency].merch * 100 : 0 })).sort((a, b) => f.view === "time" ? b.label.localeCompare(a.label) : b.net - a.net || a.label.localeCompare(b.label));
  return { totals, breakdown, ledger, warnings, selectedOrders: rows.length, categories: [...new Map(input.flatMap((o) => o.items.map((i) => [i.category_slug, i.category] as const))).entries()].sort((a, b) => a[1].localeCompare(b[1])), promos: [...new Set(input.map((o) => o.promo_code).filter((p): p is string => !!p))].sort() };
}
export type IncomeReport = ReturnType<typeof buildIncomeReport>;
const csvCell = (v: unknown) => { let text = String(v ?? ""); if (typeof v !== "number" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`; return `"${text.replace(/"/g, '""')}"`; };
export function incomeCsv(report: IncomeReport, view: IncomeFilters["view"]) {
  const money = (v: number) => (v / 100).toFixed(2);
  const headers = view === "ledger" ? ["Reference", "Order date (Asia/Bangkok)", "Status", "Placed by (current role)", "Items", "Currency", "Gross merch", "Sale savings", "Bundle savings", "Promo savings", "Net merch", "Shipping", "Order total", "Realized income", "Refunded", "Payment", "Promo code"] : ["Name", "Variant", "Currency", "Units sold", "Orders", "Gross merch", "Sale savings (allocated)", "Bundle savings", "Promo savings", "Net merch", "Refunded merch", "Share %"];
  const rows = view === "ledger" ? report.ledger.map((r) => [r.reference, r.date, r.status, r.placedBy ?? "Deleted account", r.items, r.currency.toUpperCase(), ...[r.gross, r.sale, r.bundle, r.promo, r.merch, r.shipping, r.paid, r.realized, r.refunded].map(money), r.payment, r.promoCode]) : report.breakdown.map((r) => [r.label, r.detail, r.currency.toUpperCase(), r.units, r.orders, ...[r.gross, r.sale, r.bundle, r.promo, r.net, r.refunds].map(money), r.share.toFixed(2)]);
  return "\uFEFF" + [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}
