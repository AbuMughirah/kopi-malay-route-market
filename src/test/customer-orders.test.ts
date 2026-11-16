import { describe, expect, it } from "vitest";
import { countVerifiedOrders, lifetimeSpend, orderSource } from "@/lib/customer-orders";

const user = { id: "u1", email: "Ahmad@Example.com" };
describe("customer purchase history", () => {
  it("counts only verified, shipped, received and completed orders", () => {
    const rows = ["pending_verification", "rejected", "refunded", "verified", "shipped", "received", "completed"].map((status) => ({ user_id: "u1", guest_email: null, status }));
    expect(countVerifiedOrders(rows, user)).toBe(4);
  });
  it("matches guest checkouts by email only when no account is attached", () => {
    expect(orderSource({ user_id: null, guest_email: "ahmad@example.com " }, user)).toBe("guest_email");
    expect(orderSource({ user_id: "u2", guest_email: "ahmad@example.com" }, user)).toBeNull();
    expect(orderSource({ user_id: "u1", guest_email: null }, user)).toBe("member");
  });
  it("keeps RM and THB spend separate and skips refunded orders", () => {
    const s = lifetimeSpend([{ status: "completed", currency: "myr", total_amount: 120.1 }, { status: "verified", currency: "myr", total_amount: 0.2 }, { status: "refunded", currency: "myr", total_amount: 99 }, { status: "shipped", currency: "thb", total_amount: 650 }]);
    expect(s).toEqual({ myr: 120.3, thb: 650, myrOrders: 2, thbOrders: 1 });
  });
});
