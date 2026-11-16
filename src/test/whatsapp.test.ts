import { describe, expect, it } from "vitest";
import { buildOrderWhatsAppUrl } from "@/lib/whatsapp";

describe("buildOrderWhatsAppUrl", () => {
  it("pre-fills only the order reference to Kopi Malay's number", () => {
    const url = buildOrderWhatsAppUrl("KM-20878");
    expect(url.startsWith("https://wa.me/66970098182?text=")).toBe(true);
    expect(decodeURIComponent(url.split("text=")[1] ?? "")).toBe("Hi Kopi Malay, I have a question regarding my order KM-20878.");
  });
  it("never carries a link or token, and rejects non-reference input", () => {
    const url = buildOrderWhatsAppUrl("KM-20878&t=secret-token");
    expect(url).toBe("https://wa.me/66970098182");
    expect(buildOrderWhatsAppUrl("KM-20878")).not.toMatch(/token|http.*http|order-success/);
  });
});
