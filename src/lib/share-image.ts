import homeShareCard from "@/assets/kopi-malay-share-card.jpg.asset.json";

/** Public site origin used for absolute share-preview and sitemap URLs. */
export const SITE_ORIGIN = "https://kopimalay.com";

/** Fixed 1200x630 brand card (Kopi Malay x Tak Route 1 logos, centred for square crops) used for homepage shares. */
export const HOME_SHARE_IMAGE = homeShareCard.url;
export const HOME_SHARE_ALT = "Kopi Malay x Tak Route 1 official merchandise";

/**
 * Absolute URL for a social share preview (WhatsApp, Telegram, Facebook), or null.
 * Only hosted photos (CDN assets, catalog uploads, full https URLs) qualify; bundled
 * build-time images and unknown keys return null so hosting supplies its own preview.
 */
export function shareImageUrl(src: string | null | undefined): string | null {
  if (!src) return null;
  if (src.startsWith("https://")) return src;
  if (src.startsWith("/__l5e/assets-v1/") || src.startsWith("/api/public/product-image/")) return `${SITE_ORIGIN}${src}`;
  return null;
}

/** og:image + twitter:image meta entries for a share image, or none. */
export function shareImageMeta(src: string | null | undefined, alt: string) {
  const url = shareImageUrl(src);
  if (!url) return [];
  return [
    { property: "og:image", content: url },
    { property: "og:image:alt", content: alt },
    { name: "twitter:image", content: url },
  ];
}
