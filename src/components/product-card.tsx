import { catName } from "@/lib/i18n/dictionary";
import { useI18n } from "@/hooks/use-i18n";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import bestSellerRibbon from "@/assets/best-seller-ribbon.png.asset.json";
import { WishlistButton } from "@/components/wishlist-button";
import { effectivePrice, effectivePriceThb, formatRM, imageFor, isApparel, type Product } from "@/lib/shop";

export function PriceTag({ p, className = "" }: { p: Product; className?: string }) {
  const onSale = effectivePrice(p) < p.price;
  return (
    <div className={`flex flex-wrap items-baseline gap-2 ${className}`}>
      <span className={onSale ? "font-semibold text-sale" : "font-semibold"}>{formatRM(effectivePrice(p))}</span>
      {onSale && <span className="text-sm text-muted-foreground line-through">{formatRM(p.price)}</span>}
      {p.price_thb != null && <span><span className="text-muted-foreground">/ </span><span className="font-semibold">THB {effectivePriceThb(p)!.toFixed(2)}</span>{effectivePriceThb(p)! < p.price_thb && <> <span className="text-sm text-muted-foreground line-through">THB {p.price_thb.toFixed(2)}</span></>}</span>}
    </div>
  );
}

export function ProductCard({ p }: { p: Product }) {
  const { add, setOpen } = useCart();
  const { t, lang } = useI18n();
  const [picking, setPicking] = useState(false);
  const onSale = effectivePrice(p) < p.price || (p.price_thb != null && (effectivePriceThb(p) ?? p.price_thb) < p.price_thb);

  const addWith = async (variant: string) => {
    await add(p, variant, 1);
    setPicking(false);
    toast.success(`${p.name}${variant ? ` (${variant})` : ""} ${t("p.added")}`, { action: { label: t("p.viewCart"), onClick: () => setOpen(true) } });
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border bg-card">
      <WishlistButton productId={p.id} name={p.name} className="absolute right-2 top-2 z-10" />
      <Link to="/product/$slug" params={{ slug: p.slug }} className="relative block aspect-square overflow-hidden border-b bg-background">
        <img src={imageFor(p.images[0])} alt={p.name} loading="lazy" decoding="async" width={1024} height={1024} className="size-full object-contain transition-transform duration-500 group-hover:scale-105" />
        {onSale && <span className="absolute left-2 top-2 rounded-sm bg-sale px-2 py-0.5 font-display text-xs font-bold uppercase text-sale-foreground">{t("card.sale")}</span>}
        {p.is_featured && !onSale && <img src={bestSellerRibbon.url} alt="Best seller" width={240} height={200} decoding="async" className="pointer-events-none absolute left-1 top-1 h-auto w-20 sm:w-24" />}
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{catName(lang, p.category_slug, p.category_name)}</p>
        <Link to="/product/$slug" params={{ slug: p.slug }} className="font-medium leading-snug hover:text-primary">{p.name}</Link>
        <PriceTag p={p} />
        <div className="mt-auto pt-2">
          {picking ? (
            <div className="flex flex-wrap gap-1">
              {(p.variants.sizes ?? []).map((s) => (
                <Button variant="outline" size="sm" key={s} onClick={() => addWith(s)} className="min-w-9 px-2">{s}</Button>
              ))}
            </div>
          ) : (
            <Button
              onClick={() => (isApparel(p) ? setPicking(true) : addWith(""))}
              className="w-full rounded-md bg-ink py-2 font-display text-sm font-semibold uppercase text-ink-foreground transition-colors hover:bg-primary"
            >
              {isApparel(p) ? t("card.chooseSize") : t("p.addToCart")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
