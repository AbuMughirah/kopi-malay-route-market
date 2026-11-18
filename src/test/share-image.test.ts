import { describe, expect, it } from "vitest";
import { shareImageMeta, shareImageUrl } from "@/lib/share-image";

describe("share preview images", () => {
  it("makes hosted CDN photos absolute on kopimalay.com", () => {
    expect(shareImageUrl("/__l5e/assets-v1/abc/tee.jpg")).toBe("https://kopimalay.com/__l5e/assets-v1/abc/tee.jpg");
  });
  it("makes catalog uploads absolute on kopimalay.com", () => {
    expect(shareImageUrl("/api/public/product-image/p/1.jpg")).toBe("https://kopimalay.com/api/public/product-image/p/1.jpg");
  });
  it("keeps full https URLs unchanged", () => {
    expect(shareImageUrl("https://cdn.example.com/a.jpg")).toBe("https://cdn.example.com/a.jpg");
  });
  it("skips bundled build images and missing photos", () => {
    expect(shareImageUrl("/assets/p-tee-123.jpg")).toBeNull();
    expect(shareImageUrl(undefined)).toBeNull();
    expect(shareImageMeta("/src/assets/p-tee.jpg", "Tee")).toEqual([]);
  });
  it("sets the same photo for og:image and twitter:image", () => {
    const meta = shareImageMeta("/__l5e/assets-v1/abc/tee.jpg", "Tee");
    const og = meta.find((m) => "property" in m && m.property === "og:image")?.content;
    const tw = meta.find((m) => "name" in m && m.name === "twitter:image")?.content;
    expect(og).toBe("https://kopimalay.com/__l5e/assets-v1/abc/tee.jpg");
    expect(tw).toBe(og);
  });
});
