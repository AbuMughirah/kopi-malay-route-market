import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/hooks/use-i18n";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/product-card";
import { productsQuery } from "@/lib/queries";
import { useWishlist } from "@/hooks/use-wishlist";

export const Route = createFileRoute("/wishlist")({ staticData: { sitemap: false },
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  head: () => ({
    meta: [
      { title: "My Wishlist — Kopi Malay Route 1" },
      { name: "description", content: "Your saved Route 1 stickers, jerseys and merch to buy later." },
      { property: "og:title", content: "My Wishlist — Kopi Malay Route 1" },
      { property: "og:description", content: "Saved Route 1 merch to revisit later." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { data: products } = useSuspenseQuery(productsQuery);
  const { ids } = useWishlist();
  const { t } = useI18n();
  const saved = ids.map((id) => products.find((p) => p.id === id)).filter((p) => p != null);
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold uppercase">{t("wl.title")}</h1>
      {saved.length === 0 ? (
        <p className="mt-4 text-muted-foreground">{t("wl.empty")} <Link to="/shop" className="font-medium text-foreground underline">{t("wl.browse")}</Link></p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
          {saved.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
