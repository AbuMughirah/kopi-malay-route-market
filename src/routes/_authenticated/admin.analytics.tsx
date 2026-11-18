import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getTrafficReport } from "@/lib/analytics.functions";
import type { Range } from "@/lib/analytics";

export const Route = createFileRoute("/_authenticated/admin/analytics")({ staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: "Traffic Analytics | Kopi Malay Admin" },
    { name: "description", content: "Visitors, conversion funnel, channels and top products for the Kopi Malay store." },
    { property: "og:title", content: "Traffic Analytics | Kopi Malay Admin" },
    { property: "og:description", content: "Kopi Malay store traffic analytics." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: AnalyticsAdmin,
});

const RANGES: [Range, string][] = [["today", "Today"], ["7d", "Last 7 days"], ["30d", "Last 30 days"]];
const STEP: Record<string, string> = { page_view: "Visited store", product_view: "Viewed a product", checkout_start: "Opened checkout", order_completed: "Placed order" };

function AnalyticsAdmin() {
  const fetchReport = useServerFn(getTrafficReport);
  const [range, setRange] = useState<Range>("7d");
  const { data, isLoading, error } = useQuery({ queryKey: ["admin", "traffic", range], queryFn: () => fetchReport({ data: { range } }), staleTime: 60_000 });
  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto" role="tablist">
        {RANGES.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={range === k} onClick={() => setRange(k)} className={`whitespace-nowrap rounded-md border px-3 py-1.5 text-sm font-semibold ${range === k ? "bg-primary text-primary-foreground" : "bg-card"}`}>{l}</button>
        ))}
      </div>
      {error ? <p className="text-destructive">{error.message}</p> : isLoading || !data ? <p className="text-muted-foreground">Loading…</p> : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi label="Pageviews" value={data.pageviews.toLocaleString()} />
            <Kpi label="Unique visitors" value={data.visitors.toLocaleString()} />
            <Kpi label="Conversion rate" value={`${data.conversionRate}%`} />
            <Kpi label="Checkout drop-off" value={`${data.checkoutDropOff}%`} />
          </div>
          <section className="rounded-lg border bg-card p-4">
            <h2 className="font-display text-sm font-bold uppercase">Conversion funnel</h2>
            <div className="mt-3 space-y-2">
              {data.funnel.map((f) => {
                const pct = data.visitors ? Math.round((f.visitors / data.visitors) * 100) : 0;
                return (
                  <div key={f.step}>
                    <div className="flex justify-between text-sm"><span>{STEP[f.step]}</span><span className="font-semibold">{f.visitors} · {pct}%</span></div>
                    <div className="mt-1 h-2 rounded bg-muted"><div className="h-2 rounded bg-foreground" style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </section>
          <div className="grid gap-4 md:grid-cols-2">
            <List title="Top products viewed" rows={data.products} unit="views" />
            <List title="Traffic channels" rows={data.referrers} unit="visitors" />
            <List title="Countries" rows={data.countries} unit="visitors" />
            <List title="Devices" rows={data.devices} unit="visitors" />
          </div>
          <p className="text-xs text-muted-foreground">Anonymous and cookie-free. Staff, admin pages and bots are excluded. Raw visits are kept 90 days.</p>
        </>
      )}
    </div>
  );
}

const Kpi = ({ label, value }: { label: string; value: string }) => (
  <div className="min-w-0 rounded-lg border bg-card p-4"><p className="truncate text-xs uppercase text-muted-foreground">{label}</p><p className="mt-1 font-display text-2xl font-bold">{value}</p></div>
);
const List = ({ title, rows, unit }: { title: string; rows: { key: string; count: number }[]; unit: string }) => (
  <section className="min-w-0 rounded-lg border bg-card p-4">
    <h2 className="font-display text-sm font-bold uppercase">{title}</h2>
    {rows.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No data yet.</p> : (
      <ul className="mt-2 divide-y text-sm">{rows.map((r) => <li key={r.key} className="flex justify-between gap-3 py-1.5"><span className="truncate capitalize">{r.key.replace(/-/g, " ")}</span><span className="shrink-0 font-semibold">{r.count} {unit}</span></li>)}</ul>
    )}
  </section>
);
