import { useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ChartPeriod, IncomeReport, TrendPoint, TrendSeries } from "@/lib/income";

type Currency = "myr" | "thb";
type Tab = "summary" | "items" | "categories";
type Metric = "gross" | "discounts" | "merch" | "shipping" | "inflow" | "refunds";
const METRICS: [Metric, string, string][] = [
  ["gross", "Gross sales", "Before any savings"],
  ["discounts", "Discounts", "Sale + bundle + promo"],
  ["merch", "Net merchandise", "Items only, after savings"],
  ["shipping", "Shipping", "Collected for delivery"],
  ["inflow", "Realized income", "Merchandise + shipping"],
  ["refunds", "Refunds", "Refunded orders, not in income"],
];
const PERIODS: [ChartPeriod, string][] = [["hour", "Hours"], ["day", "Days"], ["week", "Weeks"], ["month", "Months"], ["year", "Years"]];
const SHADES = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const DASHES = ["0", "6 3", "2 3", "8 3 2 3", "1 2"];
const money = (c: Currency, n: number) => `${c === "myr" ? "RM" : "THB"} ${(n / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const compact = (n: number) => { const v = n / 100; return Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(v >= 10_000 ? 0 : 1)}k` : String(Math.round(v)); };
const yDomain: [number, (max: number) => number] = [0, (max) => Math.max(max, 400)];
const axis = { stroke: "var(--muted-foreground)", fontSize: 11, tickLine: false, axisLine: false } as const;
const pill = (active: boolean) => `h-9 min-w-0 shrink-0 rounded-md border px-2 text-sm sm:px-3 font-medium transition-colors ${active ? "border-foreground bg-foreground text-background" : "bg-background text-muted-foreground hover:text-foreground"}`;

type Row = { label?: string; long?: string; orders?: number; units?: number };
function ChartTooltip({ active, payload, currency, names }: { active?: boolean; payload?: { dataKey?: string | number; value?: number; payload?: Row }[]; currency: Currency; names: Record<string, string> }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  return <div className="rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
    <p className="mb-1 font-semibold">{String(row?.long ?? row?.label ?? "")}</p>
    {payload.map((p) => <p key={String(p.dataKey)} className="flex justify-between gap-4"><span className="text-muted-foreground">{names[String(p.dataKey)] ?? String(p.dataKey)}</span><span className="tabular-nums">{money(currency, Number(p.value ?? 0))}</span></p>)}
    {!!row?.orders && <p className="mt-1 text-muted-foreground">{row.orders} orders · {row.units} items</p>}
  </div>;
}

export function IncomeCharts({ chart, currencies, period, onPeriod }: { chart: IncomeReport["chart"]; currencies: Currency[]; period: ChartPeriod; onPeriod: (p: ChartPeriod) => void }) {
  const [tab, setTab] = useState<Tab>("summary");
  const [picked, setPicked] = useState<Currency>("myr");
  const currency = currencies.includes(picked) ? picked : currencies[0]!;
  const [metric, setMetric] = useState<Metric>("merch");
  const [kind, setKind] = useState<"area" | "bar">("area");
  const summary = chart.summary[currency];
  const totals = Object.fromEntries(METRICS.map(([m]) => [m, summary.reduce((s, p) => s + p[m], 0)])) as Record<Metric, number>;
  const empty = !summary.some((p) => p.orders || p.refunds);
  return <section className="space-y-4 rounded-md border bg-card p-4 sm:p-5" aria-label="Sales charts">
    <h3 className="font-display text-lg font-semibold uppercase">Sales trends</h3>
    <div className="grid grid-cols-3 border-b sm:flex sm:gap-1" role="tablist" aria-label="Chart type">
      {([["summary", "Summary"], ["items", "By item"], ["categories", "By category"]] as const).map(([key, label]) => <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={`-mb-px min-w-0 truncate border-b-2 px-2 py-2 sm:px-3 font-display text-sm font-semibold ${tab === key ? "border-foreground" : "border-transparent text-muted-foreground"}`}>{label}</button>)}
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <div className="grid w-full grid-cols-5 gap-1 sm:flex sm:w-auto" role="group" aria-label="Group chart by">{PERIODS.map(([key, label]) => <button key={key} aria-pressed={period === key} className={pill(period === key)} onClick={() => onPeriod(key)}>{label}</button>)}</div>
      {currencies.length > 1 && <div className="flex gap-1" role="group" aria-label="Chart currency">{currencies.map((c) => <button key={c} aria-pressed={currency === c} className={pill(currency === c)} onClick={() => setPicked(c)}>{c === "myr" ? "RM" : "THB"}</button>)}</div>}
      {tab !== "categories" && <div className="flex gap-1 sm:ml-auto" role="group" aria-label="Chart style">{(["area", "bar"] as const).map((k) => <button key={k} aria-pressed={kind === k} className={pill(kind === k)} onClick={() => setKind(k)}>{k === "area" ? (tab === "items" ? "Lines" : "Area") : "Bars"}</button>)}</div>}
    </div>
    {period === "hour" && <p className="text-xs text-muted-foreground">Hours add up every day in the selected range (Bangkok time), showing your busiest times of day.</p>}
    {chart.truncated && <p role="status" className="text-xs text-muted-foreground">Long range — showing the latest {summary.length} {PERIODS.find(([p]) => p === period)?.[1].toLowerCase()}. Choose Months or Years to see everything.</p>}
    {tab === "summary" && <Summary summary={summary} totals={totals} metric={metric} setMetric={setMetric} currency={currency} kind={kind} empty={empty} />}
    {tab === "items" && <Breakdown series={chart.items[currency]} summary={summary} currency={currency} kind={kind} title="Top items" noun="item" />}
    {tab === "categories" && <Breakdown series={chart.categories[currency]} summary={summary} currency={currency} kind="bar" title="Categories" noun="category" />}
  </section>;
}

function Summary({ summary, totals, metric, setMetric, currency, kind, empty }: { summary: TrendPoint[]; totals: Record<Metric, number>; metric: Metric; setMetric: (m: Metric) => void; currency: Currency; kind: "area" | "bar"; empty: boolean }) {
  const name = METRICS.find(([m]) => m === metric)?.[1] ?? "";
  return <div className="space-y-4">
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
      {METRICS.map(([key, label, hint]) => <button key={key} aria-pressed={metric === key} onClick={() => setMetric(key)} className={`min-w-0 rounded-md border p-3 text-left transition-colors ${metric === key ? "border-foreground bg-foreground text-background" : "bg-background hover:bg-muted"}`}>
        <span className="block truncate text-xs font-semibold uppercase">{label}</span>
        <span className="mt-1 block truncate font-display text-lg font-semibold tabular-nums">{money(currency, totals[key])}</span>
        <span className={`block truncate text-[11px] ${metric === key ? "opacity-75" : "text-muted-foreground"}`}>{hint}</span>
      </button>)}
    </div>
    <p className="text-sm font-semibold">{name} <span className="font-normal text-muted-foreground">· tap a box above to change the chart</span></p>
    {empty ? <EmptyChart /> : <div className="h-64 w-full sm:h-72"><ResponsiveContainer width="100%" height="100%">
      {kind === "area" ? <AreaChart data={summary} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs><linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.25} /><stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} /></linearGradient></defs>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" {...axis} minTickGap={16} />
        <YAxis {...axis} width={44} tickFormatter={compact} domain={yDomain} allowDecimals={false} />
        <Tooltip content={<ChartTooltip currency={currency} names={{ [metric]: name }} />} cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }} />
        <Area type="monotone" dataKey={metric} stroke="var(--chart-1)" strokeWidth={2} fill="url(#incomeFill)" dot={summary.length <= 31 ? { r: 2.5, fill: "var(--chart-1)" } : false} activeDot={{ r: 4 }} isAnimationActive={false} />
      </AreaChart> : <BarChart data={summary} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" {...axis} minTickGap={16} />
        <YAxis {...axis} width={44} tickFormatter={compact} domain={yDomain} allowDecimals={false} />
        <Tooltip content={<ChartTooltip currency={currency} names={{ [metric]: name }} />} cursor={{ fill: "var(--muted)" }} />
        <Bar dataKey={metric} fill="var(--chart-1)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
      </BarChart>}
    </ResponsiveContainer></div>}
  </div>;
}

function Breakdown({ series, summary, currency, kind, title, noun }: { series: TrendSeries[]; summary: TrendPoint[]; currency: Currency; kind: "area" | "bar"; title: string; noun: string }) {
  const top = series.slice(0, 5), total = series.reduce((s, x) => s + x.net, 0);
  const names = Object.fromEntries(top.map((s, i) => [`s${i}`, s.label]));
  const data = summary.map((p, at) => ({ label: p.label, long: p.long, ...Object.fromEntries(top.map((s, i) => [`s${i}`, s.points[at] ?? 0])) }));
  if (!series.length) return <EmptyChart />;
  const Swatch = ({ i }: { i: number }) => <svg aria-hidden width="22" height="10" className="shrink-0"><line x1="1" y1="5" x2="21" y2="5" stroke={SHADES[i]} strokeWidth="3" strokeDasharray={kind === "bar" ? "0" : DASHES[i]} /></svg>;
  return <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
    <div className="h-64 w-full min-w-0 sm:h-72"><ResponsiveContainer width="100%" height="100%">
      {kind === "area" ? <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" {...axis} minTickGap={16} />
        <YAxis {...axis} width={44} tickFormatter={compact} domain={yDomain} allowDecimals={false} />
        <Tooltip content={<ChartTooltip currency={currency} names={names} />} cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }} />
        {top.map((s, i) => <Line key={s.key} type="monotone" dataKey={`s${i}`} stroke={SHADES[i]} strokeWidth={2} strokeDasharray={DASHES[i]} dot={false} isAnimationActive={false} />)}
      </LineChart> : <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" {...axis} minTickGap={16} />
        <YAxis {...axis} width={44} tickFormatter={compact} domain={yDomain} allowDecimals={false} />
        <Tooltip content={<ChartTooltip currency={currency} names={names} />} cursor={{ fill: "var(--muted)" }} />
        {top.map((s, i) => <Bar key={s.key} dataKey={`s${i}`} stackId="all" fill={SHADES[i]} isAnimationActive={false} />)}
      </BarChart>}
    </ResponsiveContainer></div>
    <div className="min-w-0 space-y-2">
      <h4 className="text-xs font-semibold uppercase text-muted-foreground">{title} · net merchandise</h4>
      <ol className="space-y-2">{series.map((s, i) => { const share = total > 0 ? s.net / total * 100 : 0; return <li key={s.key} className="space-y-1 text-sm">
        <div className="flex min-w-0 items-center gap-2">{i < 5 ? <Swatch i={i} /> : <span className="w-[22px] shrink-0 text-center text-xs text-muted-foreground">{i + 1}</span>}<span className="min-w-0 flex-1 truncate" title={s.label}>{s.label}</span><span className="shrink-0 tabular-nums font-medium">{money(currency, s.net)}</span></div>
        <div className="flex items-center gap-2 pl-[30px] text-xs text-muted-foreground"><div className="h-1.5 flex-1 overflow-hidden rounded bg-muted"><div className="h-full bg-foreground" style={{ width: `${Math.max(0, Math.min(100, share))}%` }} /></div><span className="w-24 shrink-0 text-right tabular-nums">{s.units} sold · {share.toFixed(0)}%</span></div>
      </li>; })}</ol>
      {series.length > 5 && <p className="text-xs text-muted-foreground">The chart shows the top 5; the list shows the top {series.length} {noun === "item" ? "items" : "categories"}.</p>}
    </div>
  </div>;
}

const EmptyChart = () => <div className="grid h-48 place-items-center rounded-md border border-dashed text-center text-sm text-muted-foreground"><p>No confirmed sales in this range.<br />Try All time or a wider date range.</p></div>;
