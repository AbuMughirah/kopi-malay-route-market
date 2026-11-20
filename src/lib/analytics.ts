/** Browser-safe traffic analytics rules shared by the tracker, server and tests. */
export type EventType = "page_view" | "product_view" | "checkout_start" | "order_completed";
export type Range = "today" | "7d" | "30d";

const BOT = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|preview|headless|lighthouse|curl|python|wget/i;
export const isBot = (ua: string) => !ua || BOT.test(ua);

/** Admin, sign-in and API paths are never tracked. */
export const isTrackablePath = (path: string) => path.startsWith("/") && !/^\/(admin|api|lovable|auth|profile)(\/|$)/.test(path);

export function eventFor(path: string): { event: EventType; product: string | null } {
  const m = path.match(/^\/product\/([^/?#]+)/);
  if (m) return { event: "product_view", product: decodeURIComponent(m[1]!).slice(0, 120) };
  if (/^\/checkout(\/|$)/.test(path)) return { event: "checkout_start", product: null };
  if (/^\/order-success(\/|$)/.test(path)) return { event: "order_completed", product: null };
  return { event: "page_view", product: null };
}

/** A confirmation counts as a placed order only within this window after checkout. */
export const ORDER_CONFIRM_WINDOW_MS = 30 * 60_000;
export const isFreshOrder = (createdAt: string, now = Date.now()) => {
  const t = Date.parse(createdAt);
  return Number.isFinite(t) && now - t >= -60_000 && now - t <= ORDER_CONFIRM_WINDOW_MS;
};

export function deviceFor(ua: string): "mobile" | "tablet" | "desktop" {
  if (/ipad|tablet/i.test(ua)) return "tablet";
  if (/mobi|android|iphone/i.test(ua)) return "mobile";
  return "desktop";
}

export function referrerFor(ref: string, host: string): string {
  if (!ref) return "direct";
  let h: string;
  try { h = new URL(ref).hostname.replace(/^www\./, "").toLowerCase(); } catch { return "direct"; }
  if (!h || h === host.replace(/^www\./, "").toLowerCase() || h.endsWith("kopimalay.com") || h.endsWith("kopimalay.shop") || h.endsWith("lovable.app")) return "direct";
  if (/facebook|fb\.com|messenger/.test(h)) return "facebook";
  if (/instagram/.test(h)) return "instagram";
  if (/whatsapp|wa\.me/.test(h)) return "whatsapp";
  if (/google\./.test(h)) return "google";
  if (/tiktok/.test(h)) return "tiktok";
  return h.slice(0, 80);
}

export const countryFor = (cc: string | null | undefined) => (cc === "MY" || cc === "TH" ? cc : "Other");

/** Start of the range in UTC, using Bangkok midnight for "today". */
export function rangeStart(range: Range, now = new Date()): Date {
  const bkk = new Date(now.getTime() + 7 * 3600_000);
  bkk.setUTCHours(0, 0, 0, 0);
  const days = range === "today" ? 0 : range === "7d" ? 6 : 29;
  return new Date(bkk.getTime() - days * 86400_000 - 7 * 3600_000);
}

export type Row = { visitor_hash: string; event_type: string; referrer: string; device_type: string; country: string; product_slug: string | null };
const top = (m: Map<string, number>, n = 8) => [...m].sort((a, b) => b[1] - a[1]).slice(0, n).map(([key, count]) => ({ key, count }));

export function summarize(rows: Row[]) {
  const steps: EventType[] = ["page_view", "product_view", "checkout_start", "order_completed"];
  const sets = Object.fromEntries(steps.map((s) => [s, new Set<string>()])) as Record<EventType, Set<string>>;
  const all = new Set<string>();
  const ref = new Map<string, number>(), dev = new Map<string, number>(), cty = new Map<string, number>(), prod = new Map<string, number>();
  let pageviews = 0;
  for (const r of rows) {
    all.add(r.visitor_hash);
    if (r.event_type !== "order_completed") pageviews++;
    if (r.event_type in sets) sets[r.event_type as EventType].add(r.visitor_hash);
    if (r.event_type === "product_view" && r.product_slug) prod.set(r.product_slug, (prod.get(r.product_slug) ?? 0) + 1);
  }
  // Channels/devices/countries count unique visitors, not hits.
  const seen = new Set<string>();
  for (const r of rows) {
    if (seen.has(r.visitor_hash)) continue;
    seen.add(r.visitor_hash);
    ref.set(r.referrer, (ref.get(r.referrer) ?? 0) + 1);
    dev.set(r.device_type, (dev.get(r.device_type) ?? 0) + 1);
    cty.set(r.country, (cty.get(r.country) ?? 0) + 1);
  }
  const visitors = all.size;
  const funnel = steps.map((s, i) => ({ step: s, visitors: i === 0 ? visitors : sets[s].size }));
  const ordered = sets.order_completed.size, checkout = sets.checkout_start.size;
  return {
    pageviews, visitors, funnel,
    conversionRate: visitors ? Math.round((ordered / visitors) * 1000) / 10 : 0,
    checkoutDropOff: checkout ? Math.round(((checkout - Math.min(ordered, checkout)) / checkout) * 1000) / 10 : 0,
    referrers: top(ref), devices: top(dev), countries: top(cty), products: top(prod, 10),
  };
}
export type Summary = ReturnType<typeof summarize>;
