import { describe, expect, it } from "vitest";
import { SIZE_GUIDE, formatMeasure } from "@/lib/size-guide";

describe("apparel size guide", () => {
  it("lists only stocked sizes S to 5XL, without XS", () => {
    expect(SIZE_GUIDE.map((r) => r.size)).toEqual(["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"]);
  });
  it("keeps the official chart measurements", () => {
    const by = Object.fromEntries(SIZE_GUIDE.map((r) => [r.size, r]));
    expect(by["S"]).toMatchObject({ chestCm: 96.5, chestIn: 38, lengthCm: 68.6, lengthIn: 27 });
    expect(by["L"]).toMatchObject({ chestCm: 106.7, chestIn: 42, lengthCm: 73.7, lengthIn: 29 });
    expect(by["5XL"]).toMatchObject({ chestCm: 132.1, chestIn: 52, lengthCm: 86.4, lengthIn: 34 });
  });
  it("formats each unit with one decimal like the printed chart", () => {
    expect(formatMeasure(127, 50, "both")).toBe("127.0 cm / 50.0 in");
    expect(formatMeasure(127, 50, "cm")).toBe("127.0 cm");
    expect(formatMeasure(127, 50, "in")).toBe("50.0 in");
  });
});
