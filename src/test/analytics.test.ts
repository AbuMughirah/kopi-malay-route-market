import { describe, expect, it } from "vitest";
import { eventFor, isBot, isTrackablePath, rangeStart, referrerFor, summarize } from "@/lib/analytics";

describe("traffic analytics rules", () => {
  it("never tracks admin pages", () => { expect(isTrackablePath("/admin/orders")).toBe(false); expect(isTrackablePath("/shop")).toBe(true); });
  it("rejects crawlers and link previews", () => { expect(isBot("Googlebot/2.1")).toBe(true); expect(isBot("WhatsApp/2.23")).toBe(true); expect(isBot("Mozilla/5.0 (iPhone)")).toBe(false); });
  it("maps funnel steps from paths", () => {
    expect(eventFor("/product/black-tee")).toEqual({ event: "product_view", product: "black-tee" });
    expect(eventFor("/checkout").event).toBe("checkout_start");
    expect(eventFor("/order-success").event).toBe("order_completed");
  });
  it("treats own domain as direct", () => { expect(referrerFor("https://kopimalay.com/x", "kopimalay.com")).toBe("direct"); expect(referrerFor("https://l.facebook.com/", "kopimalay.com")).toBe("facebook"); });
  it("today starts at Bangkok midnight", () => { expect(rangeStart("today", new Date("2026-11-17T20:00:00Z")).toISOString()).toBe("2026-11-17T17:00:00.000Z"); });
  it("counts conversions by unique visitor, not refreshes", () => {
    const r = (v: string, e: string) => ({ visitor_hash: v, event_type: e, referrer: "direct", device_type: "mobile", country: "MY", product_slug: null });
    const s = summarize([r("a", "page_view"), r("a", "checkout_start"), r("a", "order_completed"), r("a", "order_completed"), r("b", "page_view"), r("b", "checkout_start")]);
    expect(s.visitors).toBe(2);
    expect(s.conversionRate).toBe(50);
    expect(s.checkoutDropOff).toBe(50);
  });
});
