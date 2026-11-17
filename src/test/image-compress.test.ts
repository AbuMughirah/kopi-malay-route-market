import { describe, expect, it } from "vitest";
import { compressImage, scaledSize, shouldCompress } from "@/lib/image-compress";

describe("image compression rules", () => {
  it("never touches PDF receipts", () => {
    expect(shouldCompress({ type: "application/pdf", size: 4_000_000 })).toBe(false);
  });
  it("skips images under 150KB", () => {
    expect(shouldCompress({ type: "image/jpeg", size: 100 * 1024 })).toBe(false);
    expect(shouldCompress({ type: "image/jpeg", size: 200 * 1024 })).toBe(true);
  });
  it("keeps PNGs when asked (transparent product photos)", () => {
    expect(shouldCompress({ type: "image/png", size: 2_000_000 }, { keepPng: true })).toBe(false);
    expect(shouldCompress({ type: "image/png", size: 2_000_000 })).toBe(true);
  });
  it("limits the longest side to 1600px", () => {
    expect(scaledSize(4000, 3000, 1600)).toEqual({ width: 1600, height: 1200 });
    expect(scaledSize(1000, 800, 1600)).toEqual({ width: 1000, height: 800 });
  });
  it("returns the original file when compression fails", async () => {
    const f = new File([new Uint8Array(300 * 1024)], "broken.jpg", { type: "image/jpeg" });
    expect(await compressImage(f)).toBe(f);
  });
});
