import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { listTowing, updateTowing } from "@/lib/admin.functions";
import { TOWING_STATUSES, URGENCY_LABEL, TRANSPORT_LABEL } from "@/lib/towing";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin/towing")({ staticData: { sitemap: false }, component: TowingAdmin });

type Row = Awaited<ReturnType<typeof listTowing>>[number];
type Status = (typeof TOWING_STATUSES)[number];

function TowingAdmin() {
  const fetchAll = useServerFn(listTowing);
  const save = useServerFn(updateTowing);
  const qc = useQueryClient();
  const { data = [], isLoading, error } = useQuery({ queryKey: ["admin", "towing"], queryFn: () => fetchAll() });
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const counts = useMemo(() => Object.fromEntries(TOWING_STATUSES.map((s) => [s, data.filter((t) => t.status === s).length])), [data]);
  const rows = data.filter((t) => (filter === "all" || t.status === filter) && (!q || [t.reference, t.name, t.phone, t.plate_number, t.passport_number ?? "", t.pickup_town ?? ""].join(" ").toLowerCase().includes(q.toLowerCase())));
  const open = data.find((t) => t.id === openId) ?? null;

  const setStatus = async (t: Row, status: Status) => {
    setSaving(true);
    try { await save({ data: { id: t.id, status } }); toast.success(`Marked ${status}`); await qc.invalidateQueries({ queryKey: ["admin", "towing"] }); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setSaving(false); }
  };

  if (error) return <p className="text-destructive">{error.message}</p>;
  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  const chip = (v: "all" | Status, label: string, n: number) => (
    <button key={v} onClick={() => setFilter(v)} className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${filter === v ? "bg-primary text-primary-foreground" : ""}`}>{label} ({n})</button>
  );
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {chip("all", "All", data.length)}
        {TOWING_STATUSES.map((s) => chip(s, s, counts[s] ?? 0))}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ref, name, phone, plate, passport…" className="ml-auto w-full rounded-md border bg-card px-3 py-1.5 text-sm sm:w-72" />
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-muted text-left font-display text-xs uppercase">
            <tr>{["Ref", "Urgency", "Rider", "From", "To", "Status"].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} onClick={() => setOpenId(t.id)} className="cursor-pointer border-t align-top hover:bg-muted/50">
                <td className="px-3 py-2 font-mono text-xs">{t.reference}<div className="text-muted-foreground">{new Date(t.created_at).toLocaleString()}</div></td>
                <td className="px-3 py-2">{t.urgency === "urgent" ? <span className="rounded bg-foreground px-2 py-0.5 text-xs font-bold text-background">URGENT</span> : <span className="text-xs text-muted-foreground">Not urgent</span>}</td>
                <td className="px-3 py-2">{t.name}<div className="text-xs text-muted-foreground">{t.rider_type === "foreign" ? `Foreign · ${t.nationality ?? ""}` : "Thai local"}</div></td>
                <td className="max-w-[200px] px-3 py-2">{t.pickup_town ? `${t.pickup_town}` : t.breakdown_location}</td>
                <td className="max-w-[200px] px-3 py-2">{t.destination_town ?? t.destination}</td>
                <td className="px-3 py-2 capitalize">{t.status}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">No towing requests.</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {open && <Details t={open} saving={saving} onStatus={(s) => setStatus(open, s)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Details({ t, saving, onStatus }: { t: Row; saving: boolean; onStatus: (s: Status) => void }) {
  const tel = t.phone.replace(/[^\d+]/g, "");
  const gps = t.pickup_lat != null && t.pickup_lng != null ? `https://www.google.com/maps?q=${t.pickup_lat},${t.pickup_lng}` : null;
  const next: Status[] = t.status === "new" ? ["dispatched", "cancelled"] : t.status === "dispatched" ? ["completed", "cancelled"] : [];
  const row = (k: string, v: React.ReactNode) => <div className="grid grid-cols-[120px_1fr] gap-2 py-1"><span className="text-muted-foreground">{k}</span><span>{v}</span></div>;
  return (
    <>
      <DialogHeader><DialogTitle className="font-mono">{t.reference} · <span className="capitalize">{t.status}</span></DialogTitle></DialogHeader>
      <div className="space-y-4 text-sm">
        <div className="flex flex-wrap gap-2">
          <a href={`https://wa.me/${tel.replace("+", "")}`} target="_blank" rel="noreferrer" className="rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground">WhatsApp</a>
          <a href={`tel:${tel}`} className="rounded-md border px-3 py-2 font-medium">Call {t.phone}</a>
        </div>
        <section>
          <h3 className="font-display text-xs font-bold uppercase">Rider</h3>
          {row("Name", t.name)}
          {row("Type", t.rider_type === "foreign" ? "Foreign rider" : "Thai local")}
          {t.rider_type === "foreign" && <>
            {row("Nationality", t.nationality)}
            {row("Passport", <span className="font-mono">{t.passport_number} <button className="ml-2 underline" onClick={() => { navigator.clipboard.writeText(t.passport_number ?? ""); toast.success("Passport copied"); }}>Copy</button></span>)}
          </>}
          {row("Motorcycle", `${t.motorcycle_model} (${t.plate_number})`)}
          {row("Urgency", URGENCY_LABEL[t.urgency as keyof typeof URGENCY_LABEL] ?? t.urgency)}
          {row("Transport", TRANSPORT_LABEL[t.rider_transport as keyof typeof TRANSPORT_LABEL] ?? t.rider_transport)}
        </section>
        <section>
          <h3 className="font-display text-xs font-bold uppercase">Location</h3>
          {row("From", [t.pickup_town, t.pickup_region].filter(Boolean).join(", ") || "—")}
          {row("Spot", t.breakdown_location)}
          {t.maps_link && row("Maps", <a href={t.maps_link} target="_blank" rel="noreferrer" className="underline">Open link</a>)}
          {gps && row("GPS", <a href={gps} target="_blank" rel="noreferrer" className="underline">{t.pickup_lat}, {t.pickup_lng}</a>)}
          {row("To", [t.destination_town, t.destination_region].filter(Boolean).join(", ") || "—")}
          {row("Address", t.destination)}
        </section>
        {t.photo_urls.length > 0 && (
          <section>
            <h3 className="font-display text-xs font-bold uppercase">Photos</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {t.photo_urls.map((u, i) => <a key={u} href={u} target="_blank" rel="noreferrer"><img src={u} alt={`Photo ${i + 1}`} loading="lazy" decoding="async" className="h-20 w-20 rounded-md border object-cover" /></a>)}
            </div>
          </section>
        )}
        {next.length > 0 && (
          <div className="flex gap-2 border-t pt-3">
            {next.map((s) => <button key={s} disabled={saving} onClick={() => onStatus(s)} className={`flex-1 rounded-md px-3 py-2 font-medium capitalize disabled:opacity-50 ${s === "cancelled" ? "border" : "bg-primary text-primary-foreground"}`}>Mark {s}</button>)}
          </div>
        )}
      </div>
    </>
  );
}
