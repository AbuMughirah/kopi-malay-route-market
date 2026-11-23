import { useI18n } from "@/hooks/use-i18n";
import { fill } from "@/lib/i18n/dictionary";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Clock } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { recordVisit } from "@/lib/analytics.functions";
import { getOrderByReference } from "@/lib/checkout.functions";
import { formatMoney } from "@/lib/shop";
import { buildOrderWhatsAppUrl } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { customerStatus } from "@/lib/order-flow";
import { OrderTracking } from "@/components/order-tracking";

export const Route = createFileRoute("/order-success")({ staticData: { sitemap: false },
  validateSearch: (s: Record<string, unknown>): { ref?: string; t?: string } => ({
    ref: typeof s["ref"] === "string" ? s["ref"] : "",
    t: typeof s["t"] === "string" ? s["t"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Order submitted — Kopi Malay x Route 1" },
      { name: "description", content: "Your Kopi Malay Route 1 order and payment proof were submitted for verification." },
      { property: "og:title", content: "Order submitted — Kopi Malay x Route 1" },
      { property: "og:description", content: "Payment proof submitted, pending verification." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderSuccess,
});

function OrderSuccess() {
  const { ref = "", t: token = "" } = Route.useSearch();
  const { clear } = useCart();
  const { t } = useI18n();
  const { data: order, isLoading } = useQuery({
    queryKey: ["order-ref", ref, token],
    queryFn: () => getOrderByReference({ data: { ref, token } }),
    enabled: !!ref && !!token,
  });
  useEffect(() => { if (order) void clear(); }, [order, clear]);
  const placed = !!order;
  useEffect(() => {
    if (placed) void recordVisit({ data: { path: "/order-success", referrer: "", ref, token } }).catch(() => {});
  }, [placed, ref, token]);

  if (isLoading) return <p className="p-24 text-center text-muted-foreground">{t("os.loading")}</p>;
  if (!order) return <div className="p-24 text-center"><p>{t("os.notFound")}</p><Link to="/shop" className="text-primary underline">{t("os.backShop")}</Link></div>;

  const a = order.shipping_address;
  const money = (v: number) => formatMoney(v, order.currency);
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">{t("os.ref")}</p>
        <h1 className="font-display text-4xl font-bold">{order.order_number}</h1>
        <span className={`mt-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold ${order.status === "refunded" ? "border border-foreground bg-background text-foreground" : "bg-accent text-accent-foreground"}`}>
          <Clock className="size-4" /> {customerStatus(order.status)}
        </span>
        <p className="mt-3 text-sm text-muted-foreground">{fill(t("os.emailed"), { email: order.email ?? "" })}</p>
      </div>
      <div className="mt-6"><OrderTracking status={order.status} country={a.country} currency={order.currency} tracking_number={order.tracking_number} /></div>
      <div className="mt-8 rounded-lg border bg-card p-5 text-sm">
        <p className="text-muted-foreground">{t("co.shipTo")}</p>
        <p>{a.name}, {a.address}, {a.postcode} {a.city}, {a.state}, {a.country} · {a.phone}</p>
        <ul className="mt-5 divide-y border-y">
          {order.items.map((i, idx) => (
            <li key={idx} className="flex justify-between gap-3 py-2">
              <span>{i.product_name}{i.selected_variant && ` (${t("os.size")} ${i.selected_variant})`} × {i.quantity}</span>
              <span>{money(i.unit_price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1">
          <div className="flex justify-between"><dt>{t("co.subtotal")}{order.sale_discount > 0 ? t("co.regular") : ""}</dt><dd>{money(order.subtotal + order.sale_discount)}</dd></div>
          {order.sale_discount > 0 && <div className="flex justify-between text-primary"><dt>{t("co.sale")}</dt><dd>- {money(order.sale_discount)}</dd></div>}
          {order.sticker_bundle_discount > 0 && <div className="flex justify-between text-primary"><dt>{t("os.bundle")}</dt><dd>- {money(order.sticker_bundle_discount)}</dd></div>}
          {order.discount_amount > 0 && <div className="flex justify-between text-primary"><dt>Promo {order.promo_code}</dt><dd>- {money(order.discount_amount)}</dd></div>}
          <div className="flex justify-between"><dt>{t("co.shipping")}</dt><dd>{order.shipping_fee === 0 ? t("co.free") : money(order.shipping_fee)}</dd></div>
          <div className="flex justify-between font-display text-lg font-bold"><dt>{t("os.totalPayable")}</dt><dd>{money(order.total_amount)}</dd></div>
        </dl>
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <a href={buildOrderWhatsAppUrl(order.order_number)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-md border bg-card px-5 py-2.5 font-display font-semibold uppercase"><WhatsAppIcon className="size-4" />{t("os.whatsapp")}</a>
        <Link to="/shop" className="rounded-md bg-ink px-5 py-2.5 font-display font-semibold uppercase text-ink-foreground">{t("os.keep")}</Link>
      </div>
    </div>
  );
}
