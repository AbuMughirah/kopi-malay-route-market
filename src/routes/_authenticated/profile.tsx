import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { customerStatus } from "@/lib/order-flow";
import { formatMoney, MY_STATES, TH_PROVINCES } from "@/lib/shop";
import { PlacePicker } from "@/components/PlacePicker";
import { capitalizeFormDetails, capitalizeFormValue } from "@/lib/form-capitals";
import { OrderTracking } from "@/components/order-tracking";
import { buildOrderWhatsAppUrl } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { trackingStage } from "@/lib/tracking";
import { CONTACT_OPTIONS, EMPTY_PROFILE, loadMyProfile, type Profile } from "@/lib/profile";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — Kopi Malay Route 1" },
      { name: "description", content: "Manage your Kopi Malay member details, delivery address and motorcycle garage." },
      { property: "og:title", content: "My Profile — Kopi Malay Route 1" },
      { property: "og:description", content: "Member profile, delivery address and motorcycle details." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

const field = "w-full rounded-md border bg-card px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring";

function ProfilePage() {
  const [p, setP] = useState<Profile>(EMPTY_PROFILE);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [shown, setShown] = useState(ORDERS_PAGE);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
    loadMyProfile().then((r) => { if (r) setP(capitalizeFormDetails(r)); setLoading(false); });
    supabase.from("orders").select(ORDER_COLUMNS).order("created_at", { ascending: false }).limit(200)
      .then(({ data }) => setOrders((data ?? []).map(toMyOrder)));
  }, []);

  const set = (k: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setP((prev) => ({ ...prev, [k]: capitalizeFormValue(k, e.target.value) }));
  const input = (k: keyof Profile, label: string, placeholder = "", type = "text") => (
    <div className="space-y-1.5">
      <label htmlFor={`pf-${k}`} className="text-sm font-medium">{label}</label>
      <input id={`pf-${k}`} type={type} autoCapitalize={k === "contact_handle" ? "none" : "characters"} value={p[k]} placeholder={placeholder} maxLength={200} onChange={set(k)} className={field} />
    </div>
  );

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setBusy(true);
    const trimmed = Object.fromEntries(Object.entries(capitalizeFormDetails(p)).map(([k, v]) => [k, v.trim()])) as Profile;
    const { error } = await supabase.from("profiles").upsert({ id: user.id, ...trimmed, updated_at: new Date().toISOString() });
    setBusy(false);
    if (error) toast.error(error.message); else toast.success("Profile saved");
  };

  if (loading) return <p className="mx-auto max-w-3xl px-4 py-10 text-muted-foreground">Loading…</p>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold uppercase md:text-4xl">My Profile</h1>
      <p className="mt-2 text-muted-foreground">Signed in as {email}. These details pre-fill checkout and towing requests.</p>
      <form onSubmit={save} className="mt-6 space-y-8">
        <section className="space-y-4 rounded-lg border p-5">
          <h2 className="font-display text-lg font-bold uppercase">Personal &amp; contact</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {input("full_name", "Full name", "AHMAD BIN ALI")}
            {input("phone", "Phone number", "+60 12-345 6789", "tel")}
            <div className="space-y-1.5">
              <label htmlFor="pf-preferred_contact" className="text-sm font-medium">Preferred contact</label>
              <select id="pf-preferred_contact" value={p.preferred_contact} onChange={set("preferred_contact")} className={`${field} uppercase`}>
                {CONTACT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            {input("contact_handle", "Contact handle (optional)", "@telegram or alternate number")}
          </div>
        </section>
        <section className="space-y-4 rounded-lg border p-5">
          <h2 className="font-display text-lg font-bold uppercase">Default delivery address</h2>
          <div className="space-y-1.5">
            <label htmlFor="pf-address" className="text-sm font-medium">Address</label>
            <textarea id="pf-address" rows={2} autoCapitalize="characters" value={p.address} maxLength={300} onChange={set("address")} className={field} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {input("city", "City")}
            <div className="space-y-1.5">
              <label htmlFor="pf-state" className="text-sm font-medium">{p.country === "thailand" ? "Province" : "State"}</label>
              <PlacePicker uppercase id="pf-state" value={p.state} options={p.country === "thailand" ? TH_PROVINCES : MY_STATES} onValueChange={(v) => setP((prev) => ({ ...prev, state: v }))} placeholder={p.country === "thailand" ? "Type to search province" : "Type to search state"} className={field} />
            </div>
            {input("postcode", "Postcode")}
            <div className="space-y-1.5">
              <label htmlFor="pf-country" className="text-sm font-medium">Country</label>
              <select id="pf-country" value={p.country} onChange={(e) => setP({ ...p, country: e.target.value, state: "" })} className={`${field} uppercase`}>
                <option value="malaysia">Malaysia</option>
                <option value="thailand">Thailand</option>
              </select>
            </div>
          </div>
        </section>
        <section className="space-y-4 rounded-lg border p-5">
          <h2 className="font-display text-lg font-bold uppercase">Motorcycle garage</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {input("motorcycle_make", "Make", "HONDA")}
            {input("motorcycle_model", "Model", "CB500X")}
            {input("motorcycle_plate", "Plate number", "WXY 1234")}
          </div>
        </section>
        <button disabled={busy} className="w-full rounded-md bg-primary py-3 font-display font-semibold uppercase text-primary-foreground hover:opacity-90 disabled:opacity-50">{busy ? "Saving…" : "Save profile"}</button>
      </form>
      <section className="mt-8 space-y-3 rounded-lg border p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-bold uppercase">My orders{orders.length ? ` (${orders.length})` : ""}</h2>
          {orders.length > 0 && <p className="text-xs text-muted-foreground">Tap an order to see items and tracking.</p>}
        </div>
        {!orders.length ? <p className="text-sm text-muted-foreground">No orders yet.</p> : (
          <>
            <ul className="space-y-3">
              {orders.slice(0, shown).map((o) => <li key={o.id}><OrderCard o={o} open={o.id === firstTrackable(orders)} /></li>)}
            </ul>
            {shown < orders.length && (
              <button type="button" onClick={() => setShown((n) => n + ORDERS_PAGE)} className="w-full rounded-md border py-2.5 font-display text-sm font-semibold uppercase">
                Show more orders ({orders.length - shown} more)
              </button>
            )}
          </>
        )}
      </section>
    </div>
  );
}

const ORDERS_PAGE = 10;
const ORDER_COLUMNS = "id,order_number,created_at,status,currency,total_amount,subtotal,shipping_fee,discount_amount,sticker_bundle_discount,sale_discount,promo_code,tracking_number,shipping_address,order_items(product_name,selected_variant,quantity,unit_price)";

type MyOrder = {
  id: string; order_number: string; created_at: string; status: string; currency: string; tracking_number: string | null; promo_code: string | null;
  total_amount: number; subtotal: number; shipping_fee: number; discount_amount: number; sticker_bundle_discount: number; sale_discount: number;
  address: { name?: string; address?: string; city?: string; state?: string; postcode?: string; country?: string; phone?: string };
  items: { product_name: string; selected_variant: string | null; quantity: number; unit_price: number }[];
};

function toMyOrder(o: Record<string, unknown>): MyOrder {
  const n = (v: unknown) => Number(v ?? 0);
  const items = (o["order_items"] as MyOrder["items"] | null) ?? [];
  return {
    id: String(o["id"]), order_number: String(o["order_number"]), created_at: String(o["created_at"]), status: String(o["status"]), currency: String(o["currency"]),
    tracking_number: (o["tracking_number"] as string | null) ?? null, promo_code: (o["promo_code"] as string | null) ?? null,
    total_amount: n(o["total_amount"]), subtotal: n(o["subtotal"]), shipping_fee: n(o["shipping_fee"]), discount_amount: n(o["discount_amount"]),
    sticker_bundle_discount: n(o["sticker_bundle_discount"]), sale_discount: n(o["sale_discount"]),
    address: (o["shipping_address"] as MyOrder["address"] | null) ?? {},
    items: items.map((i) => ({ ...i, unit_price: n(i.unit_price) })),
  };
}

/** The newest order currently in transit opens automatically so its tracking is one glance away. */
const firstTrackable = (orders: MyOrder[]) => orders.find((o) => trackingStage(o.status) === "shipped" && o.tracking_number)?.id;

function OrderCard({ o, open }: { o: MyOrder; open: boolean }) {
  const money = (v: number) => formatMoney(v, o.currency);
  const count = o.items.reduce((s, i) => s + i.quantity, 0);
  const a = o.address;
  const inTransit = trackingStage(o.status) === "shipped" && !!o.tracking_number;
  return (
    <details open={open || undefined} className="group rounded-lg border">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 p-3 text-sm [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="font-mono font-semibold">{o.order_number}</span>
          <span className="text-muted-foreground"> · {new Date(o.created_at).toLocaleDateString()} · {count} item{count === 1 ? "" : "s"}</span>
        </span>
        <span className="flex flex-wrap items-center gap-2">
          {inTransit && <span className="rounded-full border border-foreground px-2 py-0.5 text-[11px] font-semibold uppercase">Tracking ready</span>}
          <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${o.status === "refunded" ? "border border-foreground" : "bg-accent text-accent-foreground"}`}>{customerStatus(o.status)}</span>
          <span className="font-semibold tabular-nums">{money(o.total_amount)}</span>
          <span aria-hidden className="text-lg leading-none transition-transform group-open:rotate-45">+</span>
        </span>
      </summary>
      <div className="space-y-4 border-t p-3 text-sm">
        <OrderTracking compact status={o.status} country={a.country} currency={o.currency} tracking_number={o.tracking_number} />
        <ul className="divide-y">
          {o.items.map((i, idx) => (
            <li key={idx} className="flex justify-between gap-3 py-1.5">
              <span className="min-w-0 break-words">{i.product_name}{i.selected_variant ? ` (Size ${i.selected_variant})` : ""} × {i.quantity}</span>
              <span className="shrink-0 tabular-nums">{money(i.unit_price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-1 border-t pt-2">
          <div className="flex justify-between"><dt>Subtotal{o.sale_discount > 0 ? " (regular price)" : ""}</dt><dd>{money(o.subtotal + o.sale_discount)}</dd></div>
          {o.sale_discount > 0 && <div className="flex justify-between"><dt>Sale</dt><dd>- {money(o.sale_discount)}</dd></div>}
          {o.sticker_bundle_discount > 0 && <div className="flex justify-between"><dt>Sticker bundle savings</dt><dd>- {money(o.sticker_bundle_discount)}</dd></div>}
          {o.discount_amount > 0 && <div className="flex justify-between"><dt>Promo {o.promo_code}</dt><dd>- {money(o.discount_amount)}</dd></div>}
          <div className="flex justify-between"><dt>Shipping</dt><dd>{o.shipping_fee === 0 ? "Free" : money(o.shipping_fee)}</dd></div>
          <div className="flex justify-between font-display font-bold"><dt>Total</dt><dd>{money(o.total_amount)}</dd></div>
        </dl>
        <a href={buildOrderWhatsAppUrl(o.order_number)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium underline"><WhatsAppIcon className="size-4" />Ask on WhatsApp about this order</a>
        {a.address && (
          <p className="break-words text-muted-foreground"><span className="font-semibold text-foreground">Ship to:</span> {[a.name, a.address, [a.postcode, a.city].filter(Boolean).join(" "), a.state, a.country].filter(Boolean).join(", ")}</p>
        )}
      </div>
    </details>
  );
}
