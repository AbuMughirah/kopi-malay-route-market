import { useI18n } from "@/hooks/use-i18n";
import { fill } from "@/lib/i18n/dictionary";
import { WishlistButton } from "@/components/wishlist-button";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PriceTag } from "@/components/product-card";
import { useCart } from "@/hooks/use-cart";
import { productQuery } from "@/lib/queries";
import { availableStock, imageFor, isApparel } from "@/lib/shop";
import { SITE_ORIGIN, shareImageMeta } from "@/lib/share-image";
import { ProductImageViewer } from "@/components/product-image-viewer";
import { ApparelSizeGuide, SizeGuideTable } from "@/components/apparel-size-guide";

export const Route = createFileRoute("/product/$slug")({ staticData: { sitemap: true },
  loader: async ({ context, params }) => {
    const p = await context.queryClient.ensureQueryData(productQuery(params.slug));
    if (!p) throw notFound();
    return { name: p.name, description: p.description, shareImage: imageFor(p.images[0]) };
  },
  head: ({ loaderData, params }) => ({
    links: loaderData ? [{ rel: "canonical", href: `${SITE_ORIGIN}/product/${params.slug}` }] : [],
    meta: loaderData
      ? [
          { title: `${loaderData.name} — Kopi Malay Route 1` },
          { name: "description", content: loaderData.description.slice(0, 155) },
          { property: "og:title", content: `${loaderData.name} — Kopi Malay Route 1` },
          { property: "og:description", content: loaderData.description.slice(0, 155) },
          { property: "og:type", content: "product" },
          { name: "twitter:card", content: "summary_large_image" },
          { property: "og:url", content: `${SITE_ORIGIN}/product/${params.slug}` },
          ...shareImageMeta(loaderData.shareImage, loaderData.name),
        ]
      : [{ title: "Product unavailable — Kopi Malay" }, { name: "robots", content: "noindex" }],
  }),
  component: ProductPage,
  notFoundComponent: () => (
    <div className="p-16 text-center"><p className="mb-4">Product not found.</p><Link to="/shop" className="text-primary underline">Back to shop</Link></div>
  ),
  errorComponent: ({ error }) => <p className="p-8 text-sale">{error instanceof Error ? error.message : "Something went wrong"}</p>,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: p } = useSuspenseQuery(productQuery(slug));
  const { add, setOpen } = useCart();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  if (!p) return null;
  const apparel = isApparel(p);
  const sizeKey = apparel ? size : "";
  const left = apparel && !size ? null : availableStock(p, sizeKey);
  const soldOut = left !== null && left <= 0;
  const allSoldOut = !!p.stock && Object.values(p.stock).every((n) => n <= 0);
  const ready = (!apparel || !!size) && !soldOut && !allSoldOut;

  const doAdd = async (buy: boolean) => {
    if (!ready) { toast.warning(soldOut ? t("p.soldOutToast") : t("p.selectSizeFirst")); return; }
    if (left !== null && qty > left) { toast.warning(fill(t("p.onlyLeft"), { n: left })); return; }
    await add(p, size, qty);
    if (buy) navigate({ to: "/checkout" });
    else toast.success(`${p.name} ${t("p.added")}`, { action: { label: t("p.viewCart"), onClick: () => setOpen(true) } });
  };

  const goBack = () => {
    const idx = (window.history.state as { __TSR_index?: number } | null)?.__TSR_index ?? 0;
    if (idx > 0) window.history.back();
    else if (p.category_slug) navigate({ to: "/shop/$category", params: { category: p.category_slug } });
    else navigate({ to: "/shop" });
  };

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 md:grid-cols-2 md:gap-12">
      <div className="relative">
        <ProductImageViewer key={p.id} images={p.images} name={p.name} />
        <button type="button" aria-label={t("p.closeBack")} onClick={(e) => { e.stopPropagation(); goBack(); }}
          className="absolute right-3 top-3 z-10 grid size-10 place-items-center rounded-full border border-foreground/15 bg-background/90 text-foreground shadow-md backdrop-blur-sm">
          <X className="size-5" />
        </button>
      </div>
      <div>
        <Link to="/shop/$category" params={{ category: p.category_slug }} className="text-xs uppercase tracking-widest text-primary">{p.category_name}</Link>
        <div className="mt-2 flex items-start justify-between gap-3"><h1 className="font-display text-3xl font-bold md:text-4xl">{p.name}</h1><WishlistButton productId={p.id} name={p.name} className="shrink-0" /></div>
        <PriceTag p={p} className="mt-3 text-xl" />
        {allSoldOut ? <p className="mt-2 text-sm font-semibold text-sale">{t("p.soldOut")}</p>
          : left !== null && left > 0 && left <= 10 ? <p role="status" className="mt-2 inline-flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-1.5 text-sm font-bold text-destructive"><span className="relative flex size-2.5"><span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive opacity-75 motion-reduce:animate-none" /><span className="relative inline-flex size-2.5 rounded-full bg-destructive" /></span><span className="animate-pulse motion-reduce:animate-none">{fill(t("p.onlyLeftSoon"), { n: left })}</span></p>
          : left !== null && left > 10 ? <p className="mt-2 text-sm text-muted-foreground">{t("p.inStock")}</p> : null}
        {apparel && (
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between gap-3"><p className="font-display text-sm font-semibold uppercase">{t("p.size")} {size && <span className="text-muted-foreground">— {size}</span>}</p><ApparelSizeGuide selected={size} /></div>
            <div className="flex flex-wrap gap-2">
              {(p.variants.sizes ?? []).map((s) => (
                <Button variant="outline" key={s} disabled={availableStock(p, s) === 0} onClick={() => { setSize(s); setQty(1); }} className={`min-w-12 px-3 font-medium ${size === s ? "border-ink bg-ink text-ink-foreground" : "bg-card hover:border-ink"}`}>{s}</Button>
              ))}
            </div>
          </div>
        )}
        <div className="mt-6 flex items-center gap-3">
          <p className="font-display text-sm font-semibold uppercase">{t("p.qty")}</p>
          <div className="flex items-center rounded-md border bg-card">
            <button aria-label={t("p.decQty")} className="p-3" onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="size-4" /></button>
            <span className="w-8 text-center">{qty}</span>
            <button aria-label={t("p.incQty")} className="p-3" onClick={() => setQty(left !== null ? Math.min(left, qty + 1) : qty + 1)}><Plus className="size-4" /></button>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button disabled={!ready} onClick={() => doAdd(false)} className="rounded-md bg-ink py-3 font-display font-semibold uppercase text-ink-foreground hover:bg-primary disabled:opacity-40">{t("p.addToCart")}</button>
          <button disabled={!ready} onClick={() => doAdd(true)} className="rounded-md bg-sale py-3 font-display font-semibold uppercase text-sale-foreground hover:opacity-90 disabled:opacity-40">{t("p.buyNow")}</button>
        </div>
        {!ready && <p className="mt-2 text-sm text-muted-foreground">{soldOut || allSoldOut ? t("p.soldOutSoon") : t("p.selectSize")}</p>}
        <Accordion type="single" collapsible defaultValue="desc" className="mt-8">
          <AccordionItem value="desc"><AccordionTrigger className="font-display uppercase">{t("p.description")}</AccordionTrigger><AccordionContent>{p.description}</AccordionContent></AccordionItem>
          {apparel && (
            <AccordionItem value="size"><AccordionTrigger className="font-display uppercase">{t("sg.button")}</AccordionTrigger>
              <AccordionContent><SizeGuideTable selected={size} /></AccordionContent>
            </AccordionItem>
          )}
          <AccordionItem value="ship"><AccordionTrigger className="font-display uppercase">{t("p.shipping")}</AccordionTrigger>
            <AccordionContent className="space-y-2">
              <p>{t(p.category_slug === "tumblers" ? "ship.productTH" : "ship.productFreeTH")}</p>
              <p>{t(p.category_slug === "tumblers" ? "ship.productTumblerMY" : apparel ? "ship.productApparelMY" : "ship.productAccessoryMY")}</p>
              <p>{t("ship.productAllowance")}</p>
              {apparel && <p>{t("co.crossBorder")}</p>}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
