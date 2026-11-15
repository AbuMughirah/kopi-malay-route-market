import { z } from "zod";
import type { PlacedBy } from "./roles";

const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;
export const INCOME_SALES = ["verified", "shipped", "received", "completed"];
export const IncomeFiltersSchema = z.object({
  from: z.string().date().optional(), to: z.string().date().optional(),
  currency: z.enum(["all", "myr", "thb"]).default("all"),
  category: z.string().max(120).default(""), product: z.string().max(200).default(""),
  promo: z.string().max(120).default(""), sale: z.enum(["all", "sale", "regular"]).default("all"),
  pipeline: z.boolean().default(false), view: z.enum(["products", "categories", "promos", "time", "ledger"]).default("products"),
  period: z.enum(["day", "month", "year"]).default("month"),
  /** Daily clock window in Asia/Bangkok, "HH:MM"; start inclusive, end exclusive, may wrap past midnight. */
  timeFrom: z.string().regex(CLOCK).optional(), timeTo: z.string().regex(CLOCK).optional(),
  chart: z.enum(["hour", "day", "week", "month", "year"]).default("day"),
}).refine((f) => !f.from || !f.to || f.from <= f.to, { message: "Start date must be before end date" })
  .refine((f) => !f.timeFrom === !f.timeTo, { message: "Choose both a start and an end time" })
  .refine((f) => !f.timeFrom || f.timeFrom !== f.timeTo, { message: "Start and end time must be different" });
export type IncomeFilters = z.infer<typeof IncomeFiltersSchema>;
export type IncomeItem = { id: string; product_id: string | null; product_name: string; selected_variant: string; quantity: number; unit_price: number; category: string; category_slug: string };
export type IncomeOrder = { id: string; order_number: string; created_at: string; status: string; pre_claim_status: string | null; currency: string; subtotal: number; sale_discount: number; sticker_bundle_discount: number; discount_amount: number; shipping_fee: number; total_amount: number; promo_code: string | null; payment_method: string; placed_by: PlacedBy | null; items: IncomeItem[] };
export type Metric = { orders: number; units: number; gross: number; sale: number; bundle: number; promo: number; merch: number; shipping: number; inflow: number; refunds: number; refundOrders: number; pending: number };
const empty = (): Metric => ({ orders: 0, units: 0, gross: 0, sale: 0, bundle: 0, promo: 0, merch: 0, shipping: 0, inflow: 0, refunds: 0, refundOrders: 0, pending: 0 });
export const cents = (n: number) => Math.round(Number(n) * 100);
export const bangkokDay = (iso: string) => new Date(new Date(iso).getTime() + 7 * 3600_000).toISOString().slice(0, 10);
/** Minutes since local midnight in Asia/Bangkok (UTC+7, no daylight saving). */
export const bangkokMinutes = (iso: string) => { const d = new Date(new Date(iso).getTime() + 7 * 3600_000); return d.getUTCHours() * 60 + d.getUTCMinutes(); };
const clockMinutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
/** True when the order falls inside the daily clock window; a window like 22:00–02:00 wraps past midnight. */
export function inClockWindow(iso: string, from?: string, to?: string) {
  if (!from || !to) return true;
  const m = bangkokMinutes(iso), a = clockMinutes(from), b = clockMinutes(to);
  return a < b ? m >= a && m < b : m >= a || m < b;
}
export type ChartPeriod = "hour" | "day" | "week" | "month" | "year";
const addDays = (day: string, n: number) => { const d = new Date(`${day}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const mondayOf = (day: string) => { const d = new Date(`${day}T00:00:00Z`); return addDays(day, -((d.getUTCDay() + 6) % 7)); };
/** Chart bucket for an order: hour of day (00–23), day, Monday-start week, month or year, all in Bangkok time. */
export function bucketKey(iso: string, period: ChartPeriod) {
  const day = bangkokDay(iso);
  if (period === "hour") return String(Math.floor(bangkokMinutes(iso) / 60)).padStart(2, "0");
  if (period === "week") return mondayOf(day);
  return period === "day" ? day : period === "month" ? day.slice(0, 7) : day.slice(0, 4);
}
export const MAX_BUCKETS = 750;
/** Every bucket between two Bangkok days (inclusive), so quiet periods show as zero instead of disappearing. */
export function bucketRange(period: ChartPeriod, first: string, last: string, hours?: { from?: string | undefined; to?: string | undefined }) {
  if (period === "hour") {
    const all = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"));
    if (!hours?.from || !hours.to) return all;
    return all.filter((h) => { const start = Number(h) * 60; return Array.from({ length: 60 }, (_, m) => start + m).some((m) => { const a = clockMinutes(hours.from!), b = clockMinutes(hours.to!); return a < b ? m >= a && m < b : m >= a || m < b; }); });
  }
  const keys: string[] = [];
  const end = bucketKey(`${last}T12:00:00+07:00`, period);
  let cursor = period === "week" ? mondayOf(first) : first;
  while (keys.length < MAX_BUCKETS + 1) {
    const key = bucketKey(`${cursor}T12:00:00+07:00`, period);
    if (key > end) break;
    if (keys.at(-1) !== key) keys.push(key);
    if (period === "day") cursor = addDays(cursor, 1);
    else if (period === "week") cursor = addDays(cursor, 7);
    else if (period === "month") { const d = new Date(`${key}-01T00:00:00Z`); d.setUTCMonth(d.getUTCMonth() + 1); cursor = d.toISOString().slice(0, 10); }
    else cursor = `${Number(key) + 1}-01-01`;
  }
  return keys;
}
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** Short axis label and longer tooltip label for a bucket key. */
export function bucketLabel(key: string, period: ChartPeriod): { short: string; long: string } {
  if (period === "hour") return { short: `${key}:00`, long: `${key}:00 – ${key}:59` };
  if (period === "year") return { short: key, long: key };
  const [y, m, d] = key.split("-"), month = MONTHS[Number(m) - 1] ?? m;
  if (period === "month") return { short: `${month} ${y?.slice(2)}`, long: `${month} ${y}` };
  if (period === "week") { const end = addDays(key, 6), [, em, ed] = end.split("-"); return { short: `${Number(d)} ${month}`, long: `${Number(d)} ${month} – ${Number(ed)} ${MONTHS[Number(em) - 1]} ${end.slice(0, 4)}` }; }
  return { short: `${Number(d)} ${month}`, long: `${Number(d)} ${month} ${y}` };
}
export type TrendPoint = { key: string; label: string; long: string; orders: number; units: number; gross: number; discounts: number; merch: number; shipping: number; inflow: number; refunds: number };
export type TrendSeries = { key: string; label: string; units: number; net: number; points: number[] };
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
      && inClockWindow(o.created_at, f.timeFrom, f.timeTo)
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
  const chart = buildTrend(rows, f, recognized);
  const breakdown = [...groups.values()].map((g) => ({ ...g, share: totals[g.currency].merch > 0 ? g.net / totals[g.currency].merch * 100 : 0 })).sort((a, b) => f.view === "time" ? b.label.localeCompare(a.label) : b.net - a.net || a.label.localeCompare(b.label));
  return { totals, breakdown, ledger, chart, warnings, selectedOrders: rows.length, categories: [...new Map(input.flatMap((o) => o.items.map((i) => [i.category_slug, i.category] as const))).entries()].sort((a, b) => a[1].localeCompare(b[1])), promos: [...new Set(input.map((o) => o.promo_code).filter((p): p is string => !!p))].sort() };
}
/** Chart series per currency; merchandise-only for items and categories, never mixing RM and THB. */
function buildTrend(rows: IncomeOrder[], f: IncomeFilters, recognized: (o: IncomeOrder) => boolean) {
  const period = f.chart, days = rows.map((o) => bangkokDay(o.created_at)).sort();
  const first = f.from ?? days[0], last = f.to ?? days.at(-1);
  const all = first && last ? bucketRange(period, first, last, { from: f.timeFrom, to: f.timeTo }) : [];
  const truncated = all.length > MAX_BUCKETS, keys = truncated ? all.slice(-MAX_BUCKETS) : all;
  const index = new Map(keys.map((k, i) => [k, i]));
  const labels = keys.map((k) => bucketLabel(k, period));
  const summary = { myr: [] as TrendPoint[], thb: [] as TrendPoint[] };
  for (const c of ["myr", "thb"] as const) summary[c] = keys.map((key, i) => ({ key, label: labels[i]!.short, long: labels[i]!.long, orders: 0, units: 0, gross: 0, discounts: 0, merch: 0, shipping: 0, inflow: 0, refunds: 0 }));
  const items = { myr: new Map<string, TrendSeries>(), thb: new Map<string, TrendSeries>() };
  const categories = { myr: new Map<string, TrendSeries>(), thb: new Map<string, TrendSeries>() };
  const add = (map: Map<string, TrendSeries>, key: string, label: string, at: number, units: number, net: number) => {
    const s = map.get(key) ?? { key, label, units: 0, net: 0, points: keys.map(() => 0) };
    s.units += units; s.net += net; s.points[at] = (s.points[at] ?? 0) + net; map.set(key, s);
  };
  for (const o of rows) {
    const c = o.currency.toLowerCase() as "myr" | "thb", at = index.get(bucketKey(o.created_at, period));
    if (at === undefined) continue;
    const p = summary[c][at]!, paid = cents(o.total_amount), shipping = cents(o.shipping_fee);
    if (o.status === "refunded") { p.refunds += paid; continue; }
    if (!recognized(o)) continue;
    const sale = cents(o.sale_discount), bundle = cents(o.sticker_bundle_discount), promo = cents(o.discount_amount);
    p.orders++; p.units += o.items.reduce((s, i) => s + i.quantity, 0); p.gross += cents(o.subtotal) + sale; p.discounts += sale + bundle + promo;
    p.merch += paid - shipping; p.shipping += shipping; p.inflow += paid;
    for (const line of incomeLines(o)) {
      add(items[c], line.product_id ?? line.product_name, line.product_name, at, line.quantity, line.net);
      add(categories[c], line.category_slug || "uncategorised", line.category || "Uncategorised", at, line.quantity, line.net);
    }
  }
  const ranked = (m: Map<string, TrendSeries>, limit?: number) => [...m.values()].sort((a, b) => b.net - a.net || a.label.localeCompare(b.label)).slice(0, limit);
  return { period, truncated, summary, items: { myr: ranked(items.myr, 10), thb: ranked(items.thb, 10) }, categories: { myr: ranked(categories.myr), thb: ranked(categories.thb) } };
}
export type IncomeReport = ReturnType<typeof buildIncomeReport>;
const csvCell = (v: unknown) => { let text = String(v ?? ""); if (typeof v !== "number" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`; return `"${text.replace(/"/g, '""')}"`; };
export function incomeCsv(report: IncomeReport, view: IncomeFilters["view"]) {
  const money = (v: number) => (v / 100).toFixed(2);
  const headers = view === "ledger" ? ["Reference", "Order date (Asia/Bangkok)", "Status", "Placed by (current role)", "Items", "Currency", "Gross merch", "Sale savings", "Bundle savings", "Promo savings", "Net merch", "Shipping", "Order total", "Realized income", "Refunded", "Payment", "Promo code"] : ["Name", "Variant", "Currency", "Units sold", "Orders", "Gross merch", "Sale savings (allocated)", "Bundle savings", "Promo savings", "Net merch", "Refunded merch", "Share %"];
  const rows = view === "ledger" ? report.ledger.map((r) => [r.reference, r.date, r.status, r.placedBy ?? "Deleted account", r.items, r.currency.toUpperCase(), ...[r.gross, r.sale, r.bundle, r.promo, r.merch, r.shipping, r.paid, r.realized, r.refunded].map(money), r.payment, r.promoCode]) : report.breakdown.map((r) => [r.label, r.detail, r.currency.toUpperCase(), r.units, r.orders, ...[r.gross, r.sale, r.bundle, r.promo, r.net, r.refunds].map(money), r.share.toFixed(2)]);
  return "\uFEFF" + [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}
