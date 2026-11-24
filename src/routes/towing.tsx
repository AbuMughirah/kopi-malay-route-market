import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/hooks/use-i18n";
import { fill } from "@/lib/i18n/dictionary";
import { compressImage } from "@/lib/image-compress";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { towingErrors, photoError, cleanPassport, TOWING_MAX_PHOTOS, TOWING_MAX_VEHICLES, RESCUE_PHONE } from "@/lib/towing";
import { submitTowingRequest } from "@/lib/towing.functions";
import { THAI_REGIONS, regionForTown } from "@/lib/thai-regions";
import { loadMyProfile } from "@/lib/profile";
import { capitalizeFormDetails, capitalizeFormValue } from "@/lib/form-capitals";

export const Route = createFileRoute("/towing")({ staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Towing & Rescue — Kopi Malay Route 1" },
      { name: "description", content: "Broken down on Route 1? Request motorcycle towing and rescue anywhere in Thailand." },
      { property: "og:title", content: "Motorcycle Towing & Rescue — Route 1" },
      { property: "og:description", content: "Stranded rider? Pick your region and request a tow." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TowingPage,
});

type Form = {
  rider_type: "thai" | "foreign"; nationality: string; passport_number: string;
  name: string; phone: string; plate_number: string; motorcycle_model: string;
  urgency: "" | "urgent" | "not_urgent"; rider_transport: "" | "with_pickup" | "own_transport";
  pickup_region: string; pickup_town: string; breakdown_location: string; maps_link: string;
  destination_region: string; destination_town: string; destination: string;
  extra_vehicles: { plate_number: string; motorcycle_model: string }[];
};
const EMPTY: Form = { rider_type: "thai", nationality: "", passport_number: "", name: "", phone: "", plate_number: "", motorcycle_model: "", urgency: "", rider_transport: "", pickup_region: "", pickup_town: "", breakdown_location: "", maps_link: "", destination_region: "", destination_town: "", destination: "", extra_vehicles: [] };
const ORDER = ["nationality", "passport_number", "name", "phone", "plate_number", "motorcycle_model", "urgency", "rider_transport", "pickup_town", "pickup_region", "breakdown_location", "maps_link", "destination_town", "destination_region", "destination"];
const field = "w-full rounded-md border bg-card px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring";

function TowingPage() {
  const submit = useServerFn(submitTowingRequest);
  const { t } = useI18n();
  const [form, setForm] = useState<Form>(EMPTY);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([]);
  const [hp, setHp] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [done, setDone] = useState<{ ref: string; photoNote?: string | undefined } | null>(null);
  const [limited, setLimited] = useState<string | null>(null);
  const setCount = (n: number) => setForm((f) => {
    const extra = f.extra_vehicles.slice(0, n - 1);
    while (extra.length < n - 1) extra.push({ plate_number: "", motorcycle_model: "" });
    return { ...f, extra_vehicles: extra };
  });
  const setExtra = (i: number, k: "plate_number" | "motorcycle_model", v: string) =>
    setForm((f) => ({ ...f, extra_vehicles: f.extra_vehicles.map((m, j) => j === i ? { ...m, [k]: capitalizeFormValue(k, v) } : m) }));
  const set = <K extends Exclude<keyof Form, "extra_vehicles">>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: capitalizeFormValue(k, v) }));

  useEffect(() => {
    loadMyProfile().then((p) => {
      if (!p) return;
      setForm((f) => ({
        ...f,
        name: f.name || capitalizeFormValue("name", p.full_name || ""),
        phone: f.phone || p.phone || "",
        plate_number: f.plate_number || capitalizeFormValue("plate_number", p.motorcycle_plate || ""),
        motorcycle_model: f.motorcycle_model || capitalizeFormValue("motorcycle_model", [p.motorcycle_make, p.motorcycle_model].filter(Boolean).join(" ")),
      }));
    }).catch(() => {});
  }, []);

  const addPhotos = async (list: FileList | null) => {
    if (!list) return;
    const room = TOWING_MAX_PHOTOS - photos.length;
    const files = Array.from(list);
    if (files.length > room) toast.error(fill(t("tw.maxPhotos"), { n: TOWING_MAX_PHOTOS }));
    const next: { file: File; url: string }[] = [];
    for (const f of files.slice(0, Math.max(0, room))) {
      const e = photoError({ type: f.type, size: 0 });
      if (e) { toast.error(`${f.name}: ${e}`); continue; }
      const c = await compressImage(f);
      const e2 = photoError(c);
      if (e2) { toast.error(`${f.name}: ${e2}`); continue; }
      next.push({ file: c, url: URL.createObjectURL(c) });
    }
    setPhotos((p) => [...p, ...next]);
  };

  const detectGps = () => {
    if (!navigator.geolocation) { toast.error(t("tw.noGps")); return; }
    setGpsBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ lat: +pos.coords.latitude.toFixed(6), lng: +pos.coords.longitude.toFixed(6) }); setGpsBusy(false); toast.success(t("tw.locAdded")); },
      () => { setGpsBusy(false); toast.error(t("tw.locFail")); },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const { extra_vehicles, ...rest } = form;
    const payload = { ...capitalizeFormDetails(rest), extra_vehicles,  passport_number: cleanPassport(form.passport_number), pickup_lat: coords?.lat ?? null, pickup_lng: coords?.lng ?? null };
    const errs = towingErrors(payload);
    setErrors(errs);
    const first = ORDER.find((k) => errs[k]) ?? Object.keys(errs).find((k) => k.startsWith("extra_vehicles."));
    if (first) { document.getElementById(`tow-${first}`)?.focus(); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("payload", JSON.stringify(payload));
      fd.set("website_hp", hp);
      photos.forEach((p) => fd.append("photos", p.file));
      const r = await submit({ data: fd });
      if (r.rateLimited) { setLimited(r.message); return; }
      setDone({ ref: r.reference, photoNote: r.photosSaved < r.photosSent ? t("tw.photoNote") : undefined });
      window.scrollTo({ top: 0 });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : fill(t("tw.sendFail"), { phone: RESCUE_PHONE }));
    } finally { setBusy(false); }
  };

  const wa = `https://wa.me/${RESCUE_PHONE.replace(/\D/g, "")}`;
  if (done) return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="font-display text-3xl font-bold uppercase">{t("tw.doneTitle")}</h1>
      <p className="mt-3 text-muted-foreground">{t("tw.doneBody")}</p>
      <p className="mt-6 inline-block rounded-md border px-4 py-2 font-display text-xl font-bold">{done.ref}</p>
      {done.photoNote && <p className="mt-4 text-sm text-muted-foreground">{done.photoNote}</p>}
    </div>
  );

  const err = (k: string) => errors[k] && <p className="text-sm text-destructive">{errors[k]}</p>;
  const inv = (k: string) => (errors[k] ? "border-destructive" : "");
  const Label = ({ k, children }: { k: string; children: React.ReactNode }) => <label htmlFor={`tow-${k}`} className="text-sm font-medium">{children}</label>;
  const text = (k: Exclude<keyof Form, "extra_vehicles">, label: string, ph: string, type = "text") => (
    <div className="space-y-1.5">
      <Label k={k}>{label} *</Label>
      <input id={`tow-${k}`} type={type} autoCapitalize={type === "text" ? "characters" : "none"} value={form[k]} placeholder={ph} onChange={(e) => set(k, e.target.value as never)} aria-invalid={!!errors[k]} className={`${field} ${inv(k)}`} />
      {err(k)}
    </div>
  );
  const choice = (k: "rider_type" | "urgency" | "rider_transport", label: string, opts: [string, string][]) => (
    <fieldset className="space-y-1.5">
      <legend className="text-sm font-medium">{label} *</legend>
      <div id={`tow-${k}`} tabIndex={-1} className="grid grid-cols-2 gap-2">
        {opts.map(([v, l]) => (
          <button type="button" key={v} onClick={() => set(k, v as never)} aria-pressed={form[k] === v}
            className={`rounded-md border px-3 py-2.5 text-sm font-medium ${form[k] === v ? "bg-primary text-primary-foreground" : "bg-card"} ${inv(k)}`}>{l}</button>
        ))}
      </div>
      {err(k)}
    </fieldset>
  );
  const place = (side: "pickup" | "destination", title: string) => {
    const rk = `${side}_region` as const, tk = `${side}_town` as const;
    return (
      <>
        <div className="space-y-1.5">
          <Label k={tk}>{title} *</Label>
          <select id={`tow-${tk}`} value={form[tk]} onChange={(e) => setForm((f) => ({ ...f, [tk]: e.target.value, [rk]: regionForTown(e.target.value) }))} aria-invalid={!!(errors[tk] || errors[rk])} className={`${field} uppercase ${inv(tk)}`}>
            <option value="">{t("tw.selectTown")}</option>
            {THAI_REGIONS.map((g) => <optgroup key={g.group} label={g.group}>{g.items.map((t) => <option key={t} value={t}>{t}</option>)}</optgroup>)}
          </select>
          {err(tk) || err(rk)}
        </div>
      </>
    );
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold uppercase md:text-4xl">{t("tw.title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("tw.intro")} <a href={wa} aria-label={`WhatsApp ${RESCUE_PHONE}`} className="whitespace-nowrap underline"><svg viewBox="0 0 24 24" className="mr-1 inline h-[1.1em] w-[1.1em] align-[-0.15em]" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-.7-.3-1.5-.7-2.2-1.4-.6-.5-1-1.2-1.2-1.6-.1-.2 0-.4.1-.5l.4-.4.2-.4v-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.2-.3-.3-.6-.4z" /></svg>{RESCUE_PHONE}</a></p>
      {limited && <div role="alert" className="mt-4 rounded-md border-2 border-foreground p-4 text-sm font-medium">{limited} <a href={wa} className="underline">{t("tw.openWa")}</a> · <a href={`tel:${RESCUE_PHONE.replace(/\s/g, "")}`} className="underline">{t("tw.call")}</a></div>}
      <form noValidate onSubmit={onSubmit} className="mt-6 space-y-8">
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>Website<input tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} name="website_hp" /></label>
        </div>

        <section className="space-y-4">
          <h2 className="font-display text-lg font-bold uppercase">{t("tw.rider")}</h2>
          {choice("rider_type", t("tw.riderType"), [["thai", t("tw.thai")], ["foreign", t("tw.foreign")]])}
          <div className="grid gap-4 sm:grid-cols-2">
            {form.rider_type === "foreign" && <>
              {text("nationality", t("tw.nationality"), "MALAYSIA")}
              <div className="space-y-1.5">
                <Label k="passport_number">{t("tw.passport")} *</Label>
                <input id="tow-passport_number" value={form.passport_number} placeholder="A12345678" autoComplete="off" data-lpignore="true" data-1p-ignore spellCheck={false} autoCapitalize="characters"
                  onChange={(e) => set("passport_number", e.target.value)} aria-invalid={!!errors["passport_number"]} className={`${field} ${inv("passport_number")}`} />
                {err("passport_number")}
              </div>
            </>}
            {text("name", t("tw.name"), "AHMAD BIN ALI")}
            {text("phone", t("tw.phone"), "+66 81 234 5678", "tel")}
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="tow-vehicle_count" className="text-sm font-medium">{t("tw.count")} *</label>
              <select id="tow-vehicle_count" value={form.extra_vehicles.length + 1} onChange={(e) => setCount(Number(e.target.value))} className={field}>
                {Array.from({ length: TOWING_MAX_VEHICLES }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
              </select>
              {form.extra_vehicles.length >= 2 && <p className="text-xs text-muted-foreground">{t("tw.group")}</p>}
            </div>
            {form.extra_vehicles.length > 0 && <p className="font-display text-sm font-bold uppercase sm:col-span-2">{fill(t("tw.moto"), { n: 1 })}</p>}
            {text("plate_number", t("tw.plate"), "WXY 1234")}
            {text("motorcycle_model", t("tw.model"), "HONDA CB500X")}
            {form.extra_vehicles.map((m, i) => (
              <div key={i} className="contents">
                <p className="font-display text-sm font-bold uppercase sm:col-span-2">{fill(t("tw.moto"), { n: i + 2 })}</p>
                {(["plate_number", "motorcycle_model"] as const).map((k) => {
                  const id = `extra_vehicles.${i}.${k}`;
                  return (
                    <div key={k} className="space-y-1.5">
                      <label htmlFor={`tow-${id}`} className="text-sm font-medium">{k === "plate_number" ? t("tw.plate") : t("tw.model")} *</label>
                      <input id={`tow-${id}`} value={m[k]} autoCapitalize="characters" placeholder={k === "plate_number" ? "WXY 1234" : "HONDA CB500X"}
                        onChange={(e) => setExtra(i, k, e.target.value)} aria-invalid={!!errors[id]} className={`${field} ${errors[id] ? "border-destructive" : ""}`} />
                      {errors[id] && <p className="text-sm text-destructive">{errors[id]}</p>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          {choice("urgency", t("tw.urgency"), [["urgent", t("tw.urgent")], ["not_urgent", t("tw.notUrgent")]])}
          {choice("rider_transport", t("tw.transport"), [["with_pickup", t("tw.withPickup")], ["own_transport", t("tw.ownTransport")]])}
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-lg font-bold uppercase">{t("tw.breakdown")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {place("pickup", t("tw.breakdownTown"))}
            <div className="space-y-1.5 sm:col-span-2">
              <Label k="breakdown_location">{t("tw.spot")} *</Label>
              <textarea id="tow-breakdown_location" rows={2} autoCapitalize="characters" value={form.breakdown_location} placeholder="KM 42 ROUTE 12, NEAR PTT STATION" onChange={(e) => set("breakdown_location", e.target.value)} aria-invalid={!!errors["breakdown_location"]} className={`${field} ${inv("breakdown_location")}`} />
              {err("breakdown_location")}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <span className="block text-sm font-medium">{t("tw.yourLoc")}</span>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={detectGps} disabled={gpsBusy} className="rounded-md border px-3 py-2 text-sm font-medium disabled:opacity-50">{gpsBusy ? t("tw.locating") : coords ? t("tw.updateGps") : t("tw.detectGps")}</button>
                {coords && <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium">✓ {t("tw.gpsDetected")} ({coords.lat}, {coords.lng}) <button type="button" className="underline" onClick={() => setCoords(null)}>{t("tw.remove")}</button></span>}
              </div>
              <Label k="maps_link">{t("tw.mapsLink")}</Label>
              <input id="tow-maps_link" type="url" inputMode="url" value={form.maps_link} placeholder="https://maps.app.goo.gl/…" onChange={(e) => set("maps_link", e.target.value)} aria-invalid={!!errors["maps_link"]} className={`${field} ${inv("maps_link")}`} />
              {err("maps_link")}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-lg font-bold uppercase">{t("tw.destination")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {place("destination", t("tw.destTown"))}
            <div className="space-y-1.5 sm:col-span-2">
              <Label k="destination">{t("tw.destAddress")} *</Label>
              <textarea id="tow-destination" rows={2} autoCapitalize="characters" value={form.destination} placeholder={t("tw.destPh")} onChange={(e) => set("destination", e.target.value)} aria-invalid={!!errors["destination"]} className={`${field} ${inv("destination")}`} />
              {err("destination")}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold uppercase">{fill(t("tw.photos"), { n: TOWING_MAX_PHOTOS })}</h2>
          <p className="text-sm text-muted-foreground">{t("tw.photosHint")}</p>
          <div className="flex flex-wrap gap-2">
            {photos.map((p, i) => (
              <div key={p.url} className="relative h-20 w-20 overflow-hidden rounded-md border">
                <img src={p.url} alt={fill(t("tw.photoN"), { n: i + 1 })} className="h-full w-full object-cover" />
                <button type="button" aria-label={fill(t("tw.removePhoto"), { n: i + 1 })} onClick={() => setPhotos((ps) => ps.filter((_, j) => j !== i))} className="absolute right-0.5 top-0.5 rounded bg-background px-1.5 text-xs font-bold">×</button>
              </div>
            ))}
            {photos.length < TOWING_MAX_PHOTOS && (
              <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-md border border-dashed text-2xl">+
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }} />
              </label>
            )}
          </div>
        </section>

        <p className="rounded-md bg-muted p-3 text-sm">{t("tw.afterSubmit")}</p>
        <button disabled={busy} className="w-full rounded-md bg-primary py-3 font-display font-semibold uppercase text-primary-foreground hover:opacity-90 disabled:opacity-50">{busy ? (photos.length ? t("tw.uploading") : t("tw.sending")) : t("tw.submit")}</button>
      </form>
    </div>
  );
}
