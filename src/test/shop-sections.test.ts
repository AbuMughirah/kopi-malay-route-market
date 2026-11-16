import { describe, expect, it } from "vitest";
import { splitSections } from "@/lib/shop-sections";
const p = (name: string) => ({ id: name, name }) as never;
describe("splitSections", () => {
  it("puts jerseys on top and t-shirts below", () => {
    const s = splitSections("jerseys-t-shirts", [p("OFFICIAL ROUTE 1 TSHIRT"), p("ANNIVERSARY EDITION JERSEY (LONG SLEEVE)")])!;
    expect(s.map((x) => [x.title, x.items.length])).toEqual([["Jerseys", 1], ["T-shirts", 1]]);
  });
  it("splits iron-on above velcro", () => {
    const s = splitSections("patches", [p("PATCHES (VELCRO) - SIGNAGE A"), p("PATCHES (IRON ON) - X")])!;
    expect(s[0]!.items[0]!.name).toContain("IRON ON");
    expect(s[1]!.items[0]!.name).toContain("VELCRO");
  });
  it("splits 8x8 above 5x5 chromium", () => {
    const s = splitSections("stickers", [p("CHROMIUM STICKERS (5x5cm) - A"), p("STICKER (8x8cm) - B")])!;
    expect(s[0]!.title).toBe("8x8cm Stickers");
    expect(s[1]!.items[0]!.name).toContain("CHROMIUM");
  });
  it("never hides unmatched products", () => {
    const s = splitSections("patches", [p("MYSTERY PATCH")])!;
    expect(s[0]!.items).toHaveLength(1);
  });
  it("returns null for unsplit categories", () => expect(splitSections("tumblers", [])).toBeNull());
});
