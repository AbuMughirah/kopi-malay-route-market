import { describe, expect, it } from "vitest";
import { SHIPPING } from "@/lib/i18n/policy-shipping";
import { REFUND } from "@/lib/i18n/policy-refund";
import { FAQ, PRIVACY, TERMS, ACCESSIBILITY } from "@/lib/i18n/policy-legal";
import { DICT } from "@/lib/i18n/dictionary";

const docs = { SHIPPING, REFUND, PRIVACY, TERMS, ACCESSIBILITY };

describe("policy translations", () => {
  for (const [name, d] of Object.entries(docs)) {
    it(`${name} has the same section count in every language`, () => {
      expect(d.ms.blocks.length).toBe(d.en.blocks.length);
      expect(d.th.blocks.length).toBe(d.en.blocks.length);
    });
  }
  it("FAQ has 6 questions in every language", () => {
    expect([FAQ.en.items.length, FAQ.ms.items.length, FAQ.th.items.length]).toEqual([6, 6, 6]);
  });
  it("shipping and track pages state the 2 PM Thailand cut-off in all languages", () => {
    const ship = (l: "en" | "ms" | "th") => JSON.stringify(SHIPPING[l]);
    expect(ship("en")).toContain("2:00 PM");
    expect(ship("ms")).toContain("2:00 petang");
    expect(ship("th")).toContain("14:00");
    expect(DICT.en["tr.whenA"]).toContain("2:00 PM");
    expect(DICT.ms["tr.whenA"]).toContain("2:00 petang");
    expect(DICT.th["tr.whenA"]).toContain("14:00");
    expect(DICT.en["tr.whenA"]).not.toContain("1–3 working days");
  });
  it("Sabah & Sarawak surcharge stays RM 10 in every language", () => {
    for (const l of ["en", "ms", "th"] as const) expect(JSON.stringify(SHIPPING[l])).toContain("RM 10");
  });
});
