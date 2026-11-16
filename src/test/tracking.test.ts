import { describe, expect, it } from "vitest";
import { courierFor, trackingHint, trackingInfo, trackingStage } from "@/lib/tracking";
import { buildShippedEmail, type ShippedOrder } from "@/lib/order-shipped";
import { emailMatches, LOOKUP_LIMITS, lookupBlocked, normalizeOrderRef, OrderLookupSchema } from "@/lib/order-lookup";

describe("courier by destination", () => {
  it("Malaysia ships with J&T Express", () => {
    expect(courierFor({ country: "Malaysia", currency: "myr" }).name).toBe("J&T Express");
    expect(trackingInfo({ country: "Malaysia", tracking_number: "630012345678" })?.url).toBe("https://www.jtexpress.my/tracking/630012345678");
  });
  it("Thailand ships with Flash Express", () => {
    expect(courierFor({ country: "Thailand", currency: "thb" }).name).toBe("Flash Express");
    expect(trackingInfo({ country: "Thailand", tracking_number: "TH47058ERNMY5I" })?.url).toBe("https://www.flashexpress.co.th/en/fle/tracking?se=TH47058ERNMY5I");
  });
  it("destination country wins over currency; currency is only the fallback", () => {
    expect(courierFor({ country: "thailand", currency: "myr" }).name).toBe("Flash Express");
    expect(courierFor({ country: null, currency: "thb" }).name).toBe("Flash Express");
    expect(courierFor({ country: "", currency: "myr" }).name).toBe("J&T Express");
  });
  it("no tracking number means no tracking link", () => {
    expect(trackingInfo({ country: "Malaysia", tracking_number: "  " })).toBeNull();
  });
});

describe("tracking stage per status", () => {
  it("maps statuses to what the customer sees", () => {
    expect(trackingStage("pending_verification")).toBe("checking");
    expect(trackingStage("verified")).toBe("preparing");
    expect(trackingStage("shipped")).toBe("shipped");
    expect(trackingStage("completed")).toBe("delivered");
    expect(trackingStage("rejected")).toBe("closed");
    expect(trackingStage("refunded")).toBe("closed");
    expect(trackingHint("refunded", "J&T Express")).toBeNull();
    expect(trackingHint("verified", "Flash Express")).toContain("Flash Express tracking number");
  });
});

const order: ShippedOrder = {
  id: "11111111-1111-1111-1111-111111111111", order_number: "KM-12345", guest_email: "rider@example.com", currency: "myr",
  access_token: "22222222-2222-2222-2222-222222222222", shipping_address: { name: "AHMAD", country: "Malaysia" },
  order_items: Array.from({ length: 10 }, (_, i) => ({ product_name: `Item ${i + 1}`, selected_variant: null, quantity: 1 })),
};

describe("shipped email", () => {
  it("goes to the order's own checkout email with the J&T link for Malaysia", () => {
    const m = buildShippedEmail(order, "630012345678", false)!;
    expect(m.to).toBe("rider@example.com");
    expect(m.templateData.courier).toBe("J&T Express");
    expect(m.templateData.trackUrl).toBe("https://www.jtexpress.my/tracking/630012345678");
    expect(m.templateData.statusLink).toBe("https://kopimalay.com/order-success?ref=KM-12345&t=22222222-2222-2222-2222-222222222222");
  });
  it("uses Flash Express for Thailand", () => {
    const m = buildShippedEmail({ ...order, currency: "thb", shipping_address: { country: "Thailand" } }, "TH123", false)!;
    expect(m.templateData.courier).toBe("Flash Express");
  });
  it("a corrected tracking number gets its own send (new idempotency key)", () => {
    const a = buildShippedEmail(order, "630000000001", false)!;
    const b = buildShippedEmail(order, "630000000002", true)!;
    expect(a.idempotencyKey).not.toBe(b.idempotencyKey);
    expect(b.templateData.corrected).toBe(true);
    expect(buildShippedEmail(order, "630000000001", false)!.idempotencyKey).toBe(a.idempotencyKey);
  });
  it("lists at most 8 items then '+N more items'", () => {
    const items = buildShippedEmail(order, "630012345678", false)!.templateData.items;
    expect(items).toHaveLength(9);
    expect(items[8]).toBe("+2 more items");
  });
  it("skips when there's no email or no tracking number", () => {
    expect(buildShippedEmail({ ...order, guest_email: null }, "630012345678", false)).toBeNull();
    expect(buildShippedEmail(order, "", false)).toBeNull();
  });
});

describe("order lookup rules", () => {
  it("accepts KM-12345, km 12345 and 12345", () => {
    expect(normalizeOrderRef("km 12345")).toBe("KM-12345");
    expect(normalizeOrderRef("12345")).toBe("KM-12345");
    expect(OrderLookupSchema.parse({ ref: "KM-12345", email: " Rider@Example.com " })).toEqual({ ref: "KM-12345", email: "rider@example.com" });
    expect(OrderLookupSchema.safeParse({ ref: "KM-1234", email: "a@b.co" }).success).toBe(false);
  });
  it("email match ignores case and spaces but must match", () => {
    expect(emailMatches("Rider@Example.com", "rider@example.com ")).toBe(true);
    expect(emailMatches("rider@example.com", "other@example.com")).toBe(false);
    expect(emailMatches(null, "rider@example.com")).toBe(false);
  });
  it("blocks after 10 failed tries per device or email, or 5 per order number, within an hour", () => {
    expect(LOOKUP_LIMITS.windowMs).toBe(3600_000);
    expect(lookupBlocked({ client: 9, email: 9, order: 4 })).toBe(false);
    expect(lookupBlocked({ client: 10, email: 0, order: 0 })).toBe(true);
    expect(lookupBlocked({ client: 0, email: 10, order: 0 })).toBe(true);
    expect(lookupBlocked({ client: 0, email: 0, order: 5 })).toBe(true);
    expect(lookupBlocked({ client: null, email: 0, order: 0 })).toBe(false);
  });
});
