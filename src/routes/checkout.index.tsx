import { useI18n } from "@/hooks/use-i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/hooks/use-cart";
import { useSuspenseQuery } from "@tanstack/react-query";
import { productsQuery } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { submitManualOrder, validatePromoCode } from "@/lib/checkout.functions";
import { PENDING_PROMO_KEY } from "@/lib/promo";
import { makeOrderRef } from "@/lib/manual-order";
import { useNavigate } from "@tanstack/react-router";
import qrAsset from "@/assets/qr-touch-n-go.jpeg.asset.json";
import thaiQrAsset from "@/assets/qr-thai-promptpay.jpg.asset.json";
import { checkoutErrors, type CheckoutField } from "@/lib/checkout-validation";
import { destinationPrice, eastMalaysiaSurcharge, formatMoney, formatParcelWeight, parcelWeight, imageFor, MY_STATES, TH_PROVINCES, profileToCheckout, shippingFee, malaysiaShippingBreakdown, thailandTumblerShipping, type Country , saleSavingUnit } from "@/lib/shop";
import { stickerBundle } from "@/lib/sticker-bundle";
import { PlacePicker } from "@/components/PlacePicker";
import { loadMyProfile } from "@/lib/profile";
import { capitalizeFormDetails, capitalizeFormValue } from "@/lib/form-capitals";
import { compressImage } from "@/lib/image-compress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const DRAFT_KEY = "km_checkout_draft";

export const Route = createFileRoute("/checkout/")({ staticData: { sitemap: false },
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  validateSearch: (s: Record<string, unknown>): { cancelled?: number | undefined } => (s["cancelled"] ? { cancelled: 1 } : {}),
  head: () => ({
    meta: [
      { title: "Checkout — Kopi Malay Route 1" },
      { name: "description", content: "Secure checkout for Kopi Malay Route 1 merchandise." },
      { property: "og:title", content: "Checkout — Kopi Malay Route 1" },
      { property: "og:description", content: "Secure checkout for Kopi Malay Route 1 merchandise." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Checkout,
});

const field = "w-full rounded-md border bg-card px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring";

function Checkout() {
  const { items, user } = useCart();
  const { t } = useI18n();
  const { data: products } = useSuspenseQuery(productsQuery);
  const { cancelled } = Route.useSearch();
  const create = useServerFn(submitManualOrder);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [ref, setRef] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!receipt || !receipt.type.startsWith("image/")) { setReceiptPreview(null); return; }
    const url = URL.createObjectURL(receipt);
    setReceiptPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [receipt]);
  const pickReceipt = async (picked: File | null) => {
    setTouched((prev) => ({ ...prev, receipt: true }));
    if (!picked) { setReceipt(null); return; }
    setCompressing(true);
    try { setReceipt(await compressImage(picked)); } finally { setCompressing(false); }
  };
  const [touched, setTouched] = useState<Partial<Record<CheckoutField, boolean>>>({});
  const [attempted, setAttempted] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  useEffect(() => {
    // Restore an unsent checkout draft if the phone reloaded the page while the customer was in their bank app.
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      const d = raw ? JSON.parse(raw) : null;
      if (d && typeof d === "object") {
        if (typeof d.ref === "string" && d.ref) setRef(d.ref); else setRef(makeOrderRef());
        if (d.f && typeof d.f === "object") setF((prev) => ({ ...prev, ...Object.fromEntries(Object.entries(d.f).filter(([k, v]) => k in prev && typeof v === "string" && v)) }));
        if (d.country === "Thailand" || d.country === "Malaysia") setCountry(d.country);
      } else setRef(makeOrderRef());
    } catch { setRef(makeOrderRef()); }
    setDraftReady(true);
  }, []);
  const [f, setF] = useState({ email: "", name: "", phone: "", address: "", city: "", state: "", postcode: "" });
  const [country, setCountry] = useState<Country>("Malaysia");
  const errors = checkoutErrors({ ...f, country }, receipt);
  const visibleError = (key: CheckoutField) => attempted || touched[key] ? errors[key] : undefined;
  const receiptMsg = visibleError("receipt");
  const inputProps = (key: CheckoutField) => ({
    id: `checkout-${key}`,
    name: key,
    required: true,
    "aria-invalid": Boolean(visibleError(key)),
    autoCapitalize: key === "email" ? "none" : "characters",
    "aria-describedby": visibleError(key) ? `checkout-${key}-error` : undefined,
    onBlur: () => setTouched((prev) => ({ ...prev, [key]: true })),
    className: `${field} ${key === "country" ? "uppercase" : ""} scroll-mt-28 ${visibleError(key) ? "border-destructive ring-1 ring-destructive focus:ring-destructive" : ""}`,
  });
  const errorPrompt = (key: CheckoutField) => visibleError(key) ? <p id={`checkout-${key}-error`} role="alert" className="text-sm text-destructive">{visibleError(key)}</p> : null;
  const currency = country === "Thailand" ? "thb" : "myr";
  const money = (value: number) => formatMoney(value, currency);
  const lines = items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    return { ...item, product, price: product ? destinationPrice(product, country) : null };
  });
  const unavailable = lines.some((line) => line.price == null);
  const subtotal = lines.reduce((sum, line) => sum + (line.price ?? 0) * line.quantity, 0);
  const sale = Math.round(lines.reduce((sum, line) => sum + (line.product ? saleSavingUnit(country === "Thailand" ? line.product.price_thb : line.product.price, line.price) : 0) * line.quantity, 0) * 100) / 100;
  const bundle = stickerBundle(lines.map((line) => ({ name: line.product?.name ?? "", category_slug: line.product?.category_slug ?? "", quantity: line.quantity })), country);
  const shippingLines = lines.map((line) => ({ quantity: line.quantity, category_slug: line.product?.category_slug ?? "other-merch", weight_kg: line.product?.weight_kg ?? null }));
  const weight = parcelWeight(shippingLines);
  const ship = shippingFee(country, shippingLines, f.state);
  const malaysiaShipping = malaysiaShippingBreakdown(shippingLines, f.state);
  const thaiShipping = country === "Thailand" ? thailandTumblerShipping(shippingLines) : null;
  const surcharge = eastMalaysiaSurcharge(country, f.state);
  const checkPromo = useServerFn(validatePromoCode);
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; discount: number; label: string } | null>(null);
  const [promoErr, setPromoErr] = useState<string | null>(null);
  const [promoBusy, setPromoBusy] = useState(false);
  const discount = promo ? Math.min(promo.discount, subtotal - bundle.discount) : 0;
  const payable = subtotal - bundle.discount - discount + (ship ?? 0);
  const promoItemsKey = items.map((i) => `${i.productId}:${i.quantity}`).join(",");
  const applyPromo = async (code: string) => {
    if (!code.trim()) return;
    setPromoBusy(true); setPromoErr(null);
    try {
      const r = await checkPromo({ data: { code: code.trim(), country, email: f.email || undefined, phone: f.phone || undefined, items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })) } });
      if (r.ok) setPromo({ code: r.code, discount: r.discount, label: r.label });
      else { setPromo(null); setPromoErr(r.error); toast.error(`Promo code not applied: ${r.error}`); }
    } catch { setPromo(null); setPromoErr("Could not check this code. Please try again."); }
    setPromoBusy(false);
  };
  useEffect(() => { if (promo) void applyPromo(promo.code); }, [country, promoItemsKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const [pendingPromo, setPendingPromo] = useState<string | null>(null);
  useEffect(() => { setPendingPromo(localStorage.getItem(PENDING_PROMO_KEY)); }, []);
  useEffect(() => {
    if (!pendingPromo || !user || promo || items.length === 0) return;
    setPromoInput(pendingPromo);
    void applyPromo(pendingPromo);
    localStorage.removeItem(PENDING_PROMO_KEY);
    setPendingPromo(null);
  }, [pendingPromo, user, items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (cancelled) toast.warning("Payment was cancelled — your cart is still saved."); }, [cancelled]);
  useEffect(() => { const email = user?.email; if (email) setF((p) => (p.email ? p : { ...p, email })); }, [user]);
  useEffect(() => {
    if (!user) return;
    let live = true;
    loadMyProfile().then((prof) => {
      if (!live || !prof) return;
      const saved = capitalizeFormDetails(profileToCheckout(prof));
      setF((prev) => {
        if (prev.name || prev.phone || prev.address || prev.city || prev.state || prev.postcode) return prev; // never overwrite typing
        setCountry(saved.country);
        return { ...prev, name: saved.name, phone: saved.phone, address: saved.address, city: saved.city, state: saved.state, postcode: saved.postcode };
      });
    });
    return () => { live = false; };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!draftReady || !ref) return;
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ref, f, country })); } catch { /* storage full or blocked */ }
  }, [draftReady, ref, f, country]);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((prev) => ({ ...prev, [k]: capitalizeFormValue(k, e.target.value) }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setAttempted(true);
    const firstInvalid = (["email", "phone", "country", "name", "address", "city", "state", "postcode", "receipt"] as const).find((key) => errors[key]);
    if (firstInvalid) {
      requestAnimationFrame(() => {
        const element = document.getElementById(`checkout-${firstInvalid}`);
        element?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
        element?.focus({ preventScroll: true });
      });
      return;
    }
    if (unavailable) { toast.warning("Some items are unavailable for this destination."); return; }
    if (ship == null) { toast.warning("Tumbler weight is unavailable. Please contact Kopi Malay for shipping."); return; }
    if (!receipt || compressing) return;
    setConfirming(true);
  };

  const placeOrder = async () => {
    if (busy || !receipt) return;
    setConfirming(false);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("payload", JSON.stringify({ ...capitalizeFormDetails(f), country, ref, promoCode: promo?.code, items: items.map((i) => ({ productId: i.productId, variant: i.variant, quantity: i.quantity })) }));
      fd.append("receipt", receipt);
      const res = await create({ data: fd });
      try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      await navigate({ to: "/order-success", search: { ref: res.ref, t: res.token } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit your order");
      setBusy(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold uppercase">{t("co.emptyTitle")}</h1>
        <Link to="/shop" className="mt-6 inline-block rounded-md bg-ink px-6 py-3 font-display font-semibold uppercase text-ink-foreground">{t("co.shopMerch")}</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-3xl font-bold uppercase md:text-4xl">{t("co.title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("co.guest")} <Link to="/auth" search={{ mode: "signup" }} className="font-medium text-foreground underline">{t("co.becomeMember")}</Link> {t("co.saveCartWishlist")}</p>
      <form noValidate onSubmit={submit} className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold uppercase">{t("co.contact")}</h2>
            <div className="space-y-1.5"><label htmlFor="checkout-email" className="text-sm font-medium">{t("co.email")} *</label>
              <input {...inputProps("email")} type="email" autoComplete="email" maxLength={255} placeholder="Email" value={f.email} onChange={set("email")} />{errorPrompt("email")}</div>
            <div className="space-y-1.5"><label htmlFor="checkout-phone" className="text-sm font-medium">{t("co.phone")} *</label>
              <input {...inputProps("phone")} type="tel" autoComplete="tel" maxLength={30} placeholder="Phone (e.g. 012-345 6789)" value={f.phone} onChange={set("phone")} />{errorPrompt("phone")}</div>
            {!user && <p className="text-sm text-muted-foreground">{t("co.haveAccount")} <Link to="/auth" className="text-primary underline">{t("co.logIn")}</Link> {t("co.toSaveCart")}</p>}
          </section>
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold uppercase">{t("co.shipAddress")}</h2>
            <label htmlFor="checkout-country" className="block text-sm font-medium">{t("co.country")} *</label>
            <select {...inputProps("country")} aria-label="Country" value={country} onChange={(e) => { const value = e.target.value; setCountry(value === "Thailand" ? value : "Malaysia"); setF((prev) => ({ ...prev, state: "" })); }}>
              <option>Malaysia</option><option>Thailand</option>
            </select>
            {errorPrompt("country")}
            {lines.some((line) => line.product?.category_slug === "jerseys-t-shirts") && country === "Malaysia" && <p className="text-sm text-muted-foreground">{t("co.crossBorder")}</p>}
            <div className="space-y-1.5"><label htmlFor="checkout-name" className="text-sm font-medium">{t("co.fullName")} *</label>
              <input {...inputProps("name")} autoComplete="name" maxLength={120} placeholder="AHMAD BIN ALI" value={f.name} onChange={set("name")} />{errorPrompt("name")}</div>
            <div className="space-y-1.5"><label htmlFor="checkout-address" className="text-sm font-medium">{t("co.street")} *</label>
              <input {...inputProps("address")} autoComplete="street-address" maxLength={300} placeholder="ADDRESS" value={f.address} onChange={set("address")} />{errorPrompt("address")}</div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5"><label htmlFor="checkout-city" className="text-sm font-medium">{t("co.city")} *</label>
                <input {...inputProps("city")} autoComplete="address-level2" maxLength={100} placeholder="CITY" value={f.city} onChange={set("city")} />{errorPrompt("city")}</div>
              <div className="space-y-1.5"><label htmlFor="checkout-state" className="text-sm font-medium">{country === "Malaysia" ? t("co.state") : t("co.province")} *</label>
                {(() => { const { onBlur, ...props } = inputProps("state"); return <PlacePicker uppercase {...props} onBlur={onBlur} aria-label={country === "Malaysia" ? "State" : "Province"} placeholder={country === "Malaysia" ? "Type to search state" : "Type to search province"} value={f.state} options={country === "Malaysia" ? MY_STATES : TH_PROVINCES} onValueChange={(v) => setF((prev) => ({ ...prev, state: v }))} />; })()}{errorPrompt("state")}</div>
              <div className="space-y-1.5"><label htmlFor="checkout-postcode" className="text-sm font-medium">{t("co.postcode")} *</label>
                <input {...inputProps("postcode")} autoComplete="postal-code" maxLength={5} placeholder="POSTCODE" inputMode="numeric" value={f.postcode} onChange={set("postcode")} />{errorPrompt("postcode")}</div>
            </div>
          </section>
          <section className="space-y-4 rounded-lg border bg-card p-5">
              <h2 className="font-display text-lg font-semibold uppercase">{country === "Thailand" ? t("co.payTH") : t("co.payMY")}</h2>
              <div className="grid items-start gap-5 sm:grid-cols-[220px_1fr]">
                <div className="mx-auto flex w-full max-w-[220px] flex-col gap-2 self-start">
                  <img src={country === "Thailand" ? thaiQrAsset.url : qrAsset.url} alt={country === "Thailand" ? "Kopi Malay Thai PromptPay payment QR code" : "Kopi Malay DuitNow / Touch 'n Go payment QR code"} className="w-full rounded-md border bg-background" />
                  <a href={country === "Thailand" ? thaiQrAsset.url : qrAsset.url} download={country === "Thailand" ? "kopi-malay-promptpay-qr.png" : "kopi-malay-duitnow-qr.jpg"} target="_blank" rel="noreferrer" className="block w-full rounded-md border bg-background px-3 py-2 text-center text-xs font-semibold uppercase hover:bg-muted">{t("co.saveQr")}</a>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="rounded-md border bg-background p-3">
                    <p className="text-muted-foreground">{t("co.amount")}</p>
                    <p className="font-display text-2xl font-bold">{unavailable || ship == null ? "—" : money(payable)}</p>
                    <p className="mt-2 text-muted-foreground">{t("co.refNote")}</p>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-xl font-bold">{ref || "…"}</span>
                      <button type="button" onClick={() => { void navigator.clipboard?.writeText(ref); toast.success(t("co.refCopied")); }} className="rounded border px-2 py-1 text-xs">{t("co.copy")}</button>
                    </div>
                  </div>
                  {country === "Thailand" ? <p><strong>Thailand:</strong> {t("co.instrTH")}</p> : <p><strong>Malaysia:</strong> {t("co.instrMY")}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <p className="font-medium">{t("co.upload")} *</p>
                <ul className="space-y-0.5 text-xs text-muted-foreground">
                  <li>✓ {t("co.chk1")}</li>
                  <li>✓ {t("co.chk2")} ({unavailable || ship == null ? "—" : money(payable)})</li>
                  <li>✓ {t("co.chk3")}</li>
                </ul>
                <input {...inputProps("receipt")} className="sr-only" required={false} type="file" accept="image/png,image/jpeg,application/pdf" onChange={(e) => { void pickReceipt(e.target.files?.[0] ?? null); e.target.value = ""; }} />
                {!receipt ? (
                  <label htmlFor="checkout-receipt" className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed p-6 text-center ${receiptMsg ? "border-destructive" : "border-border"}`}>
                    <span className="text-2xl" aria-hidden>📄</span>
                    <span className="text-sm font-semibold">{compressing ? t("co.preparing") : t("co.tapUpload")}</span>
                    <span className="text-xs text-muted-foreground">{t("co.fileTypes")}</span>
                  </label>
                ) : (
                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    {receiptPreview ? <img src={receiptPreview} alt="Your uploaded payment slip" className="h-20 w-16 shrink-0 rounded border object-cover" /> : <div className="flex h-20 w-16 shrink-0 items-center justify-center rounded border text-xs font-bold">PDF</div>}
                    <div className="min-w-0 flex-1 text-xs">
                      <p className="font-semibold">{t("co.receiptSelected")}</p>
                      <p className="truncate text-muted-foreground">{receipt.name} ({Math.max(1, Math.round(receipt.size / 1024))} KB)</p>
                      <p className="mt-1 text-muted-foreground">{t("co.checkSlip")}</p>
                      <div className="mt-2 flex gap-2">
                        <label htmlFor="checkout-receipt" className="cursor-pointer rounded border px-2 py-1 font-medium">{t("co.replace")}</label>
                        <button type="button" onClick={() => { void pickReceipt(null); }} className="rounded border px-2 py-1 font-medium">{t("co.remove")}</button>
                      </div>
                    </div>
                  </div>
                )}
                {errorPrompt("receipt")}
              </div>
          </section>
        </div>
        <aside className="h-fit rounded-lg border bg-card p-5">
          <h2 className="font-display text-lg font-semibold uppercase">{t("co.summary")}</h2>
          <ul className="mt-4 space-y-3">
            {lines.map((i) => (
              <li key={i.productId + i.variant} className="flex gap-3 text-sm">
                <img src={imageFor(i.product?.images[0] ?? i.image)} alt="" loading="lazy" decoding="async" className="size-14 rounded border object-contain" />
                <div className="flex-1"><p className="font-medium">{i.name}</p><p className="text-muted-foreground">{i.variant && `${i.variant} · `}{t("co.qty")} {i.quantity}</p></div>
                <span>{i.price == null ? t("co.unavailable") : money(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1 border-t pt-4 text-sm">
            <div className="mb-3 space-y-2">
              <label htmlFor="promo" className="font-medium">{t("co.promo")}</label>
              {promo ? (
                <div className="flex items-center justify-between rounded-md border border-primary bg-primary/10 px-3 py-2">
                  <span className="font-display font-semibold text-primary">✓ {promo.code} {t("co.applied")}</span>
                  <button type="button" onClick={() => { setPromo(null); setPromoInput(""); }} className="text-xs underline">{t("co.remove")}</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input id="promo" value={promoInput} onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoErr(null); }} aria-invalid={!!promoErr} aria-describedby={promoErr ? "promo-error" : undefined} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void applyPromo(promoInput); } }} placeholder={t("co.enterCode")} className={`${field} ${promoErr ? "border-destructive ring-1 ring-destructive focus:ring-destructive" : ""}`} />
                  <Button type="button" variant="outline" disabled={promoBusy || !promoInput.trim()} onClick={() => void applyPromo(promoInput)}>{promoBusy ? "…" : t("co.apply")}</Button>
                </div>
              )}
              {!user && pendingPromo && !promo && <p className="text-sm"><Link to="/auth" className="font-semibold underline">Sign in or create an account</Link> to activate your {pendingPromo} 5% discount.</p>}
              {promoErr && <div id="promo-error" role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-destructive"><p className="font-display text-sm font-bold uppercase">⛔ {t("co.notUsable")}</p><p className="mt-1 text-sm">{promoErr}. {t("co.noDiscount")}</p></div>}
            </div>
            <div className="flex justify-between"><dt>{t("co.subtotal")}{sale > 0 ? t("co.regular") : ""}</dt><dd>{unavailable ? "—" : money(subtotal + sale)}</dd></div>
            {!unavailable && sale > 0 && <div className="flex justify-between text-primary"><dt>{t("co.sale")}</dt><dd>- {money(sale)}</dd></div>}
            {bundle.groups > 0 && <div className="flex justify-between gap-3 text-primary"><dt>3x Sticker Bundle Discount Applied ({bundle.groups} × 3 for {money(bundle.bundle)})</dt><dd className="shrink-0">- {money(bundle.discount)}</dd></div>}
            <div className="flex justify-between gap-3"><dt>{t("co.weight")}</dt><dd className="text-right">{formatParcelWeight(weight)}</dd></div>
            {promo && discount > 0 && <div className="flex justify-between text-primary"><dt>{t("co.discount")} ({promo.code}{promo.label ? ` · ${promo.label}` : ""})</dt><dd>- {money(discount)}</dd></div>}
            <div className="flex justify-between"><dt>{t("co.shipping")}</dt><dd>{ship == null ? t("co.quote") : ship === 0 ? t("co.free") : money(ship)}</dd></div>
            {((thaiShipping && thaiShipping.blocks > 0) || (country === "Malaysia" && (malaysiaShipping.groups.some((g) => g.units > 0) || surcharge > 0))) && (
              <div className="ml-2 space-y-1 rounded-r-md border-l-2 border-muted-foreground/30 bg-muted/20 px-2.5 py-2 text-xs text-muted-foreground">
                <p className="font-medium">↳ {country} shipping breakdown (included above)</p>
                {thaiShipping && thaiShipping.blocks > 0 && <>
                  <div className="flex justify-between gap-3"><dt>Tumbler weight</dt><dd className="text-right">{formatParcelWeight(thaiShipping.weight)}</dd></div>
                  <div className="flex justify-between gap-3"><dt>Base tier (first 1kg)</dt><dd>{money(thaiShipping.base)}</dd></div>
                  {thaiShipping.surcharge > 0 && <div className="flex justify-between gap-3"><dt>Extra weight ({thaiShipping.blocks - 1} × 1kg tier)</dt><dd>{money(thaiShipping.surcharge)}</dd></div>}
                </>}
                {country === "Malaysia" && malaysiaShipping.groups.filter((g) => g.units > 0).map((g) => (
                  <div key={g.label} className="flex justify-between gap-3"><dt>{g.label}: {g.units} {g.units === 1 ? "unit" : "units"}{g.included > 0 ? ` (${g.included} free with apparel/tumbler${g.units > g.included ? `, ${g.units - g.included} charged` : ""})` : ""}{g.blocks > 0 ? ` (${g.blocks} ${g.blocks === 1 ? "block" : "blocks"} of ${g.size})` : ""}</dt><dd className="shrink-0">{money(g.fee)}</dd></div>
                ))}
                {country === "Malaysia" && surcharge > 0 && <div className="flex justify-between gap-3"><dt>Sabah &amp; Sarawak surcharge</dt><dd>{money(surcharge)}</dd></div>}
              </div>
            )}
            <div className="flex justify-between pt-2 font-display text-lg font-bold"><dt>{t("co.total")}</dt><dd>{unavailable || ship == null ? "—" : money(payable)}</dd></div>
            <p className="text-right text-xs text-muted-foreground">{t("co.vat")}</p>
          </dl>
          {unavailable && <p role="alert" className="mt-3 text-sm text-sale">Some items have no price for {country} or are no longer available. Remove them or choose another destination.</p>}
          {ship == null && <p role="alert" className="mt-3 text-sm text-sale">Tumbler weight is unavailable. Please contact Kopi Malay for shipping.</p>}
          <Button type="submit" disabled={busy || promoBusy || compressing || unavailable || ship == null} className="mt-5 h-auto w-full py-3 font-display font-semibold uppercase">
            {busy ? t("co.submitting") : t("co.confirm")}
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">{country === "Thailand" ? "Thailand: apparel and accessories free; tumblers THB 60 per started kilogram." : "Malaysia: RM 20 per 2 tumblers, RM 20 per 2 apparel items, and RM 20 per 20 accessories. Each block of 2 apparel items or 2 tumblers ships up to 20 accessories free. Sabah & Sarawak: add RM 10 per order."}</p>
        </aside>
      </form>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent className="max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display uppercase">{t("co.sureTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("co.sureDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="space-y-1 text-sm">
            {lines.map((i) => <li key={i.productId + i.variant} className="flex justify-between gap-3"><span>{i.name}{i.variant ? ` (${i.variant})` : ""} × {i.quantity}</span><span className="shrink-0">{i.price == null ? "—" : money(i.price * i.quantity)}</span></li>)}
          </ul>
          <div className="flex justify-between text-sm"><span>{t("co.shipping")}</span><span>{ship == null ? "—" : ship === 0 ? t("co.free") : money(ship)}</span></div>
          {bundle.discount + discount > 0 && <div className="flex justify-between text-sm text-primary"><span>{t("co.discounts")}</span><span>- {money(bundle.discount + discount)}</span></div>}
          <div className="flex justify-between border-t pt-2 font-display text-lg font-bold"><span>{t("co.total")}</span><span>{money(payable)}</span></div>
          <p className="text-sm text-muted-foreground">{t("co.shipTo")}: {f.name}, {f.city}, {f.state}, {country}</p>
          {receiptPreview ? <img src={receiptPreview} alt="Your payment receipt" className="mx-auto max-h-60 rounded border object-contain" /> : receipt && <p className="text-sm">Receipt: {receipt.name}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel>{t("co.goBack")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void placeOrder()}>{t("co.yesSubmit")}</AlertDialogAction>
          </AlertDialogFooter>
          <p className="text-center text-xs text-muted-foreground">{t("co.agree")} <Link to="/refund-policy" target="_blank" className="underline">{t("co.refundPolicy")}</Link>.</p>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
