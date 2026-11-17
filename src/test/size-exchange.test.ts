import { describe, expect, it } from "vitest";
import { canChangeSize, sizeChoices } from "@/lib/size-exchange";
import { wasUndoneBefore } from "@/lib/reverify";

describe("size exchange", () => {
  it("is allowed only while Pending Verification", () => {
    expect(canChangeSize("pending_verification")).toBe(true);
    for (const s of ["verified", "shipped", "received", "completed", "rejected", "refunded"]) expect(canChangeSize(s)).toBe(false);
  });
  it("disables the current size, sizes already in the order and sold-out sizes", () => {
    const c = sizeChoices({ sizes: ["S", "M", "L", "XL"], current: "M", taken: ["S"], stock: { S: 5, M: 5, L: 0, XL: 3 }, quantity: 2 });
    expect(c.filter((x) => !x.disabled).map((x) => x.size)).toEqual(["XL"]);
  });
  it("blocks a size with fewer units left than the line quantity", () => {
    expect(sizeChoices({ sizes: ["L"], current: "M", taken: [], stock: { L: 1 }, quantity: 2 })[0]?.disabled).toBe(true);
  });
});

describe("re-verify alert", () => {
  it("fires only after an earlier Undo Verify", () => {
    expect(wasUndoneBefore([{ from_status: "pending_verification", to_status: "verified" }])).toBe(false);
    expect(wasUndoneBefore([{ from_status: "pending_verification", to_status: "verified" }, { from_status: "verified", to_status: "pending_verification" }])).toBe(true);
  });
});
