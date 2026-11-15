import { createFileRoute, redirect } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTransition, useState } from "react";
import { Download, RefreshCw, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { checkIncomeOwner, getIncomeReport, exportIncomeCsv } from "@/lib/income.functions";
import { IncomeFiltersSchema, incomeDates, type DatePreset, type IncomeFilters } from "@/lib/income";
import { PLACED_LABEL } from "@/lib/roles";

const defaultFilters = (): IncomeFilters => IncomeFiltersSchema.parse({ ...incomeDates("month") });
const incomeOptions = (filters: IncomeFilters) => queryOptions({ queryKey: ["admin", "income", filters], queryFn: () => getIncomeReport({ data: filters }), staleTime: 30_000 });

export const Route = createFileRoute("/_authenticated/admin/income")({
  beforeLoad: async () => { try { await checkIncomeOwner(); } catch { throw redirect({ to: "/admin" }); } },
  loader: ({ context }) => context.queryClient.ensureQueryData(incomeOptions(defaultFilters())),
  head: () => ({ meta: [
    { title: "Income & Sales — Kopi Malay Admin" },
    { name: "description", content: "Owner-only website merchandise income, shipping, discounts and refund reports." },
    { property: "og:title", content: "Income & Sales — Kopi Malay Admin" },
    { property: "og:description", content: "Kopi Malay owner financial reports." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  errorComponent: ({ error, reset }) => <div role="alert" className="space-y-3"><p className="text-destructive">{error instanceof Error ? error.message : "Unable to load Income. Please retry."}</p><Button variant="outline" onClick={reset}>Try again</Button></div>,
  component: IncomePage,
});

const fmt = (n: number) => (n / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const presets: [DatePreset, string][] = [["today", "Today"], ["yesterday", "Yesterday"], ["week", "This week"], ["month", "This month"], ["last-month", "Last month"], ["year", "This year"], ["all", "All time"], ["custom", "Custom"]];
const views: [IncomeFilters["view"], string][] = [["products", "Products"], ["categories", "Categories"], ["promos", "Promo codes"], ["time", "By time"], ["ledger", "Order ledger"]];
const field = "h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm";

function IncomePage() {
  const [filters, setFilters] = useState(defaultFilters);
  const [preset, setPreset] = useState<DatePreset>("month");
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);
  const [updating, startTransition] = useTransition();
  const { data, refetch, isFetching } = useSuspenseQuery(incomeOptions(filters));
  const exportFn = useServerFn(exportIncomeCsv);
  const change = (patch: Partial<IncomeFilters>) => startTransition(() => setFilters((f) => ({ ...f, ...patch })));
  const currencies = filters.currency === "all" ? ["myr", "thb"] as const : [filters.currency];
  const download = async () => {
    setExporting(true);
    try {
      const csv = await exportFn({ data: filters });
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const a = document.createElement("a"); a.href = url; a.download = `income-${filters.view}-${filters.from ?? "all"}-${filters.to ?? "time"}.csv`; a.click(); URL.revokeObjectURL(url);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Export failed. Please retry."); }
    finally { setExporting(false); }
  };
  return <section className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="font-display text-2xl font-bold uppercase">Income & sales</h2><p className="mt-1 text-sm text-muted-foreground">Website orders · Bangkok time (UTC+7)</p></div>
      <div className="flex gap-2"><Button variant="outline" size="icon" aria-label="Refresh Income" title="Refresh Income" disabled={isFetching || updating} onClick={() => void refetch()}><RefreshCw className={isFetching || updating ? "animate-spin" : ""} /></Button><Button variant="outline" disabled={exporting || updating} onClick={download}><Download />{exporting ? "Exporting…" : "Download CSV"}</Button></div>
    </div>
    <div className="space-y-4 border-b pb-5">
      <div className="flex flex-wrap gap-2" aria-label="Date presets">{presets.map(([key, label]) => <Button key={key} size="sm" variant={preset === key ? "default" : "outline"} aria-pressed={preset === key} onClick={() => { setPreset(key); if (key !== "custom") { const range = incomeDates(key); change({ from: range.from, to: range.to }); } }}>{label}</Button>)}</div>
      {preset === "custom" && <div className="grid max-w-lg grid-cols-2 gap-3"><label className="space-y-1 text-xs font-semibold">From<input type="date" aria-label="From date" className={field} value={filters.from ?? ""} max={filters.to} onChange={(e) => change({ from: e.target.value || undefined })} /></label><label className="space-y-1 text-xs font-semibold">To<input type="date" aria-label="To date" className={field} value={filters.to ?? ""} min={filters.from} onChange={(e) => change({ to: e.target.value || undefined })} /></label></div>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-1 text-xs font-semibold">Currency<select aria-label="Currency" className={field} value={filters.currency} onChange={(e) => change({ currency: e.target.value as IncomeFilters["currency"] })}><option value="all">RM + THB (separate)</option><option value="myr">RM only</option><option value="thb">THB only</option></select></label>
        <label className="space-y-1 text-xs font-semibold">Category<select aria-label="Category" className={field} value={filters.category} onChange={(e) => change({ category: e.target.value })}><option value="">All categories</option>{data.categories.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label className="space-y-1 text-xs font-semibold">Promo code<select aria-label="Promo code" className={field} value={filters.promo} onChange={(e) => change({ promo: e.target.value })}><option value="">All orders</option><option value="__with">With a promo</option><option value="__without">Without a promo</option>{data.promos.map((code) => <option key={code} value={code}>{code}</option>)}</select></label>
        <label className="space-y-1 text-xs font-semibold">Sale pricing<select aria-label="Sale pricing" className={field} value={filters.sale} onChange={(e) => change({ sale: e.target.value as IncomeFilters["sale"] })}><option value="all">All pricing</option><option value="sale">Sale orders</option><option value="regular">Regular-price orders</option></select></label>
      </div>
      <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); change({ product: search.trim() }); }}>
        <label className="min-w-0 flex-1 space-y-1 text-xs font-semibold">Item or size<div className="flex gap-2"><input aria-label="Item or size" className={field} placeholder="SEARCH ITEMS OR SIZE…" value={search} onChange={(e) => setSearch(e.target.value)} /><Button type="submit" variant="outline" size="icon" aria-label="Search items" title="Search items"><Search /></Button></div></label>
        <Button type="button" variant="ghost" onClick={() => { startTransition(() => setFilters(defaultFilters())); setPreset("month"); setSearch(""); }}><X />Reset</Button>
      </form>
      <p role="status" className="text-xs text-muted-foreground">{updating ? "Updating…" : `${filters.from ?? "First order"} — ${filters.to ?? "Latest order"} · Order date · ${data.selectedOrders} orders`}</p>
      {(filters.category || filters.product) && <p className="text-xs text-muted-foreground">Matching orders · Includes all items and shipping from those orders.</p>}
    </div>
    <div className="grid gap-4 lg:grid-cols-3">
      {([["merch", "Net merchandise sales"], ["shipping", "Shipping collected"], ["inflow", "Realized income"]] as const).map(([key, label]) => <div key={key} className="rounded-md border bg-card p-5"><h3 className="text-xs font-semibold uppercase text-muted-foreground">{label}</h3><div className="mt-3 space-y-2">{currencies.map((c) => <div key={c} className="flex items-baseline justify-between gap-2"><span className="text-sm text-muted-foreground">{c === "myr" ? "RM" : "THB"}</span><span className="font-display text-2xl font-semibold tabular-nums">{fmt(data.totals[c][key])}</span></div>)}</div></div>)}
    </div>
    <div className="grid gap-x-8 gap-y-4 border-y py-4 sm:grid-cols-2 lg:grid-cols-4">
      {currencies.map((c) => { const t = data.totals[c], symbol = c === "myr" ? "RM" : "THB"; return <div key={c} className="space-y-1 text-sm"><h3 className="font-semibold">{symbol} · {t.orders} sales · {t.units} items</h3><p>Sale savings <span className="float-right tabular-nums">{fmt(t.sale)}</span></p><p>Bundle savings <span className="float-right tabular-nums">{fmt(t.bundle)}</span></p><p>Promo savings <span className="float-right tabular-nums">{fmt(t.promo)}</span></p></div>; })}
      {currencies.map((c) => <div key={`refund-${c}`} className="space-y-1 text-sm"><h3 className="font-semibold">{c === "myr" ? "RM" : "THB"} refunds</h3><p className="font-display text-xl tabular-nums">{fmt(data.totals[c].refunds)}</p><p className="text-xs text-muted-foreground">{data.totals[c].refundOrders} refunded orders · Excluded from income</p></div>)}
    </div>
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex max-w-full gap-1 overflow-x-auto border-b" role="tablist" aria-label="Income views">{views.map(([key, label]) => <Button key={key} role="tab" aria-selected={filters.view === key} variant="ghost" className={`rounded-none border-b-2 ${filters.view === key ? "border-foreground font-semibold" : "border-transparent text-muted-foreground"}`} onClick={() => change({ view: key })}>{label}</Button>)}</div>{filters.view === "time" && <select className="h-9 rounded-md border bg-background px-3 text-sm" aria-label="Time grouping" value={filters.period} onChange={(e) => change({ period: e.target.value as IncomeFilters["period"] })}><option value="day">Daily</option><option value="month">Monthly</option><option value="year">Yearly</option></select>}</div>
      {filters.view === "ledger" && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={filters.pipeline} onChange={(e) => change({ pipeline: e.target.checked })} />Include pending & rejected orders</label>}
      {!data.selectedOrders ? <div className="border-y py-14 text-center"><h3 className="font-display text-lg font-semibold">No orders in this range</h3><p className="mt-1 text-sm text-muted-foreground">{preset === "all" ? "No matching confirmed or refunded orders." : "Choose All time or a different date range."}</p></div> : <div className="max-h-[560px] overflow-auto rounded-md border">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-muted font-display text-xs uppercase"><tr>{(filters.view === "ledger" ? ["Order / date", "Status / placed by", "Currency", "Gross merch", "Sale", "Bundle", "Promo", "Net merch", "Shipping", "Order total", "Realized", "Refunded"] : [filters.view === "products" ? "Product / size" : filters.view === "time" ? "Period" : filters.view === "promos" ? "Promo code" : "Category", "Currency", "Units", "Orders", "Gross merch", "Sale*", "Bundle", "Promo", "Net merch", "Refunded merch", "Share"]).map((h) => <th key={h} className="whitespace-nowrap px-3 py-3">{h}</th>)}</tr></thead>
          <tbody>{filters.view === "ledger" ? data.ledger.map((r) => <tr key={r.reference} className="border-t"><td className="max-w-xs px-3 py-3"><p className="font-semibold">{r.reference}</p><p className="text-xs text-muted-foreground">{r.date} · {r.payment}</p><p className="mt-1 text-xs" title={r.items}>{r.items}</p></td><td className="px-3 py-3"><p className="capitalize">{r.status.replace(/_/g, " ")}</p><p className="text-xs text-muted-foreground">{r.placedBy ? PLACED_LABEL[r.placedBy] : "Deleted account"}</p></td><td className="px-3 py-3">{r.currency === "myr" ? "RM" : "THB"}</td>{[r.gross, r.sale, r.bundle, r.promo, r.merch, r.shipping, r.paid, r.realized, r.refunded].map((v, i) => <td key={i} className="whitespace-nowrap px-3 py-3 text-right tabular-nums">{fmt(v)}</td>)}</tr>) : data.breakdown.map((r) => <tr key={r.key} className="border-t"><td className="max-w-xs px-3 py-3"><p className="font-medium">{r.label}</p>{r.detail && <p className="text-xs text-muted-foreground">{r.detail}</p>}</td><td className="px-3 py-3">{r.currency === "myr" ? "RM" : "THB"}</td><td className="px-3 py-3 tabular-nums">{r.units}</td><td className="px-3 py-3 tabular-nums">{r.orders}</td>{[r.gross, r.sale, r.bundle, r.promo, r.net, r.refunds].map((v, i) => <td key={i} className="whitespace-nowrap px-3 py-3 text-right tabular-nums">{fmt(v)}</td>)}<td className="px-3 py-3 tabular-nums">{r.share.toFixed(1)}%</td></tr>)}</tbody>
        </table>
      </div>}
      <div className="space-y-1 text-xs text-muted-foreground"><p>Income excludes refunded and unverified orders. Refunds include shipping and are not deducted twice.</p><p>Revenue, not profit or bank reconciliation. Categories and account roles reflect current records. *Item sale savings are proportionally allocated.</p>{data.warnings > 0 && <p role="status">{data.warnings} historical orders have incomplete or mismatched breakdowns; saved paid totals are used.</p>}</div>
    </div>
  </section>;
}