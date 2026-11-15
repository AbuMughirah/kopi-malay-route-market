import { describe, expect, it } from "vitest";
import { CSV_HEADERS, digits, filterOrders, ordersToCsv, phoneCell, statusOptions } from "@/lib/admin-csv";
import { mergeWishlist, toggleWishlist } from "@/lib/wishlist";
import { cleanPassport, isMapsLink, photoError, rateLimited, towingAlert, TowingRequest, towingErrors } from "@/lib/towing";

const order = {
  order_number: "KM-12345", created_at: "2026-11-09T06:00:00Z", status: "pending_verification", currency: "myr", total_amount: 95,
  payment_method: "duitnow_qr", tracking_number: null, email: "a@b.com",
  address: { name: 'Ali, "Bob"', phone: "+60 12-345 6789", address: "1 Jalan", city: "KL", state: "Selangor", postcode: "50000", country: "Malaysia" },
  items: [{ product_name: "Tumbler", selected_variant: "", quantity: 2 }],
};

describe("order export", () => {
  it("uses the operational column order starting with NO., Name, Address, Phone Number", () => {
    expect(CSV_HEADERS.slice(0, 4)).toEqual(["NO.", "Name", "Address", "Phone Number"]);
  });
  it("numbers rows, escapes quotes/commas and starts with a BOM for Excel", () => {
    const csv = ordersToCsv([order]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv.split("\r\n")[1]).toMatch(/^1,"Ali, ""Bob""",/);
    expect(csv).toContain("2 × Tumbler");
  });
  it("phone search ignores formatting", () => {
    expect(digits(order.address.phone).includes(digits("019 345"))).toBe(false);
    expect(digits(order.address.phone).includes(digits("12-345"))).toBe(true);
  });
});

describe("wishlist", () => {
  it("merges guest items into the account without duplicates", () => {
    expect(mergeWishlist(["a", "b"], ["b", "c"])).toEqual(["a", "b", "c"]);
  });
  it("toggles items on and off", () => {
    expect(toggleWishlist(["a"], "a")).toEqual([]);
    expect(toggleWishlist([], "a")).toEqual(["a"]);
  });
});

describe("towing form", () => {
  const base = { rider_type: "thai", name: "Ali", phone: "+66 81 234 5678", plate_number: "WXY1", motorcycle_model: "CB500X", urgency: "urgent", rider_transport: "with_pickup",
    pickup_region: "Northern & Touring", pickup_town: "Tak", breakdown_location: "KM 45 Route 12", maps_link: "", pickup_lat: null, pickup_lng: null,
    destination_region: "Northern & Touring", destination_town: "Mae Sot", destination: "Tak workshop" };
  it("Thai local passes with no nationality or passport", () => { expect(towingErrors(base)).toEqual({}); });
  it("foreign rider requires nationality and passport", () => {
    expect(Object.keys(towingErrors({ ...base, rider_type: "foreign" })).sort()).toEqual(["nationality", "passport_number"]);
  });
  it("cleans passport spacing and case", () => {
    expect(towingErrors({ ...base, rider_type: "foreign", nationality: "Malaysia", passport_number: "a 1234-5678" })).toEqual({});
    expect(cleanPassport("a 1234-5678")).toBe("A12345678");
  });
  it("requires urgency, transport, both towns and the landmark", () => {
    const e = towingErrors({ ...base, urgency: "", rider_transport: "", pickup_town: "", destination_town: "", breakdown_location: "" });
    expect(Object.keys(e).sort()).toEqual(["breakdown_location", "destination_town", "pickup_town", "rider_transport", "urgency"]);
  });
  it("accepts only Google Maps links", () => {
    expect(isMapsLink("https://maps.app.goo.gl/abc123")).toBe(true);
    expect(isMapsLink("https://www.google.com/maps?q=16.8,99.1")).toBe(true);
    expect(isMapsLink("https://evil.example.com/maps")).toBe(false);
    expect(towingErrors({ ...base, maps_link: "http://bit.ly/x" })).toHaveProperty("maps_link");
  });
  it("rejects non-image photos and oversize photos", () => {
    expect(photoError({ type: "application/pdf", size: 10 })).not.toBeNull();
    expect(photoError({ type: "image/jpeg", size: 6 * 1024 * 1024 })).not.toBeNull();
    expect(photoError({ type: "image/jpeg", size: 1000 })).toBeNull();
  });
  it("limits 5 requests per phone per hour and 40 overall", () => {
    expect(rateLimited(4, 10)).toBe(false);
    expect(rateLimited(5, 10)).toBe(true);
    expect(rateLimited(0, 39)).toBe(false);
    expect(rateLimited(0, 40)).toBe(true);
  });
  it("alert shows passport for foreign riders and escapes user text", () => {
    const d = TowingRequest.parse({ ...base, rider_type: "foreign", nationality: "UK <b>", passport_number: "a123456", breakdown_location: "near <A&W> *_[x]" });
    const msg = towingAlert(d, "TW-12345", "15/11/26", ["https://x.test/p1"]);
    expect(msg).toContain("A123456");
    expect(msg).toContain("UK &lt;b&gt;");
    expect(msg).toContain("near &lt;A&amp;W&gt; *_[x]");
    expect(msg).toContain('href="https://x.test/p1"');
  });
  it("alert omits passport lines for Thai locals", () => {
    expect(towingAlert(TowingRequest.parse(base), "TW-1", "t", [])).not.toContain("Passport");
  });
});

describe("order export phones and filters", () => {
  it("keeps leading 0 and + as spreadsheet text", () => {
    expect(phoneCell("0123658945")).toBe('"=""0123658945"""');
    expect(phoneCell("+60123456789")).toBe('"=""+60123456789"""');
  });
  it("treats any other phone value as a guarded text cell", () => {
    expect(phoneCell('+60"&HYPERLINK("x")')).toBe(`"'+60""&HYPERLINK(""x"")"`);
    expect(phoneCell("012-345 6789")).toBe("012-345 6789");
  });
  it("adds statuses found on orders to the filter list", () => {
    expect(statusOptions([{ status: "refunded" }])).toContain("refunded");
    expect(statusOptions([])).toContain("pending");
  });
  it("filters by product, status, currency and date", () => {
    expect(filterOrders([order], { q: "tumbler" })).toHaveLength(1);
    expect(filterOrders([order], { status: "verified" })).toHaveLength(0);
    expect(filterOrders([order], { currency: "thb" })).toHaveLength(0);
    expect(filterOrders([order], { from: "2026-11-10" })).toHaveLength(0);
    expect(filterOrders([order], { q: "345 6789" })).toHaveLength(1);
  });
  it("exports subtotal, bundle, promo, shipping and total columns", () => {
    const csv = ordersToCsv([{ ...order, subtotal: 80, sticker_bundle_discount: 1.5, discount_amount: 3.5, promo_code: "KM10", shipping_fee: 20 }]);
    expect(csv.split("\r\n")[1]).toContain("80.00,1.50,KM10,3.50,20.00,95.00,MYR");
  });
});
