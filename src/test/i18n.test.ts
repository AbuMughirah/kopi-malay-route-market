import { describe, expect, it } from "vitest";
import { DICT, LANGS, isLang, translate } from "@/lib/i18n/dictionary";

describe("i18n dictionary", () => {
  it("offers exactly English, Malay and Thai", () => { expect([...LANGS]).toEqual(["en", "ms", "th"]); });
  it("has every English key translated in Malay and Thai", () => {
    for (const l of LANGS) for (const k of Object.keys(DICT.en)) expect(DICT[l][k as keyof typeof DICT.en]?.trim()).toBeTruthy();
  });
  it("rejects unknown saved languages", () => { expect(isLang("fr")).toBe(false); expect(isLang("th")).toBe(true); });
  it("translates the cart checkout button", () => { expect(translate("ms", "cart.checkout")).toBe("Bayar"); expect(translate("th", "cart.checkout")).toBe("ชำระเงิน"); });
});
