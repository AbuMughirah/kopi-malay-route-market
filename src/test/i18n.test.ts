import { describe, expect, it } from "vitest";
import { DICT, LANGS } from "@/i18n/dictionary";
describe("i18n dictionary", () => {
  it("every language has every key filled", () => {
    const keys = Object.keys(DICT.en);
    for (const l of LANGS) for (const k of keys) expect(DICT[l][k as keyof typeof DICT.en]?.trim(), `${l}:${k}`).toBeTruthy();
  });
});
