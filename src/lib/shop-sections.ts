import type { Product } from "@/lib/shop";

export type Section = { title: string; items: Product[] };
type Rule = { top: string; bottom: string; isBottom: (name: string) => boolean };

/** Visual-only splits within one category. Anything not matching the bottom rule stays in the top section, so no product is ever hidden. */
const RULES: Record<string, Rule> = {
  "jerseys-t-shirts": { top: "Jerseys", bottom: "T-shirts", isBottom: (n) => /t-?shirt|\btee\b/i.test(n) && !/jersey/i.test(n) },
  patches: { top: "Iron-on Patches", bottom: "Velcro Patches", isBottom: (n) => /velcro/i.test(n) },
  stickers: { top: "8x8cm Stickers", bottom: "5x5cm Chromium Stickers", isBottom: (n) => /chromium|5\s*x\s*5/i.test(n) },
};

export function splitSections(category: string | undefined, list: Product[]): Section[] | null {
  const rule = category ? RULES[category] : undefined;
  if (!rule) return null;
  const top = list.filter((p) => !rule.isBottom(p.name));
  const bottom = list.filter((p) => rule.isBottom(p.name));
  return [{ title: rule.top, items: top }, { title: rule.bottom, items: bottom }].filter((s) => s.items.length > 0);
}
