import { createFileRoute } from "@tanstack/react-router";
import { getRouterInstance } from "@tanstack/react-start";
import { isSitemapRouteIncluded, sitemapPathForLocation, sitemapStaticPaths, sitemapXML, type SitemapEntry } from "@/lib/sitemap";
import { SITE_ORIGIN } from "@/lib/share-image";

const BASE_URL = SITE_ORIGIN;
const PAGE_SIZE = 1000;

/** Reads every row of a public collection in stable pages; any page error fails the whole sitemap. */
async function readAll<T>(fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; ) {
    const { data, error } = await fetchPage(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    rows.push(...data);
    offset += data.length;
  }
  return rows;
}

export const Route = createFileRoute("/sitemap.xml")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      GET: async () => {
        if (!BASE_URL) {
          return new Response("Sitemap domain not configured", { status: 503, headers: { "Cache-Control": "no-store" } });
        }
        const router = await getRouterInstance();
        const entries: SitemapEntry[] = sitemapStaticPaths(router).map((path) => ({ path }));

        const { createClient } = await import("@supabase/supabase-js");
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
        const supabase = createClient(process.env["SUPABASE_URL"]!, key, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: {
            fetch: (input, init) => {
              const headers = new Headers(init?.headers);
              // Opaque sb_ keys are not JWTs; send apikey without the default bearer.
              if (key.startsWith("sb_") && headers.get("Authorization") === "Bearer " + key) headers.delete("Authorization");
              headers.set("apikey", key);
              return fetch(input, { ...init, headers });
            },
          },
        });

        try {
          const categoryRouteId = "/shop/$category";
          if (isSitemapRouteIncluded(router.routesById[categoryRouteId])) {
            // Public policy only exposes categories that contain active products.
            const cats = await readAll<{ slug: string }>((from, to) => supabase.from("categories").select("slug").order("id").range(from, to));
            for (const c of cats) {
              const location = router.buildLocation({ to: "/shop/$category", params: { category: c.slug }, search: () => ({}), hash: "" });
              const path = sitemapPathForLocation(router, location, categoryRouteId);
              if (path) entries.push({ path });
            }
          }
          const productRouteId = "/product/$slug";
          if (isSitemapRouteIncluded(router.routesById[productRouteId])) {
            const products = await readAll<{ slug: string }>((from, to) =>
              supabase.from("products").select("slug").eq("is_active", true).order("id").range(from, to));
            for (const p of products) {
              const location = router.buildLocation({ to: "/product/$slug", params: { slug: p.slug }, search: () => ({}), hash: "" });
              const path = sitemapPathForLocation(router, location, productRouteId);
              if (path) entries.push({ path });
            }
          }
        } catch (err) {
          console.error("sitemap query failed", err);
          return new Response("Sitemap temporarily unavailable", { status: 503, headers: { "Cache-Control": "no-store" } });
        }

        if (entries.length === 0) {
          return new Response(
            'No pages are included in this sitemap. Check route decisions and ancestor exclusions. Setting "exclude-subtree" on the root excludes the entire site.',
            { status: 404, headers: { "Cache-Control": "no-store" } },
          );
        }
        return new Response(sitemapXML(BASE_URL, entries), {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
