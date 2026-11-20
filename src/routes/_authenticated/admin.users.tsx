import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trackingInfo } from "@/lib/tracking";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ReceiptLink, useReceiptLink } from "@/components/receipt-link";
import { getUserOrders, listRoleChanges, listUsers, setAdminRole } from "@/lib/admin.functions";
import { filterByRole, roleCounts, ROLE_CHANGE_PAGE, ROLE_LABEL, type UserKind } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/admin/users")({ staticData: { sitemap: false },
  head: () => ({ meta: [{ title: "Users · Kopi Malay Admin" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (s: Record<string, unknown>): { viewUser?: string } => (typeof s["viewUser"] === "string" && /^[0-9a-f-]{36}$/i.test(s["viewUser"]) ? { viewUser: s["viewUser"] } : {}),
  component: UsersAdmin,
});

function UsersAdmin() {
  const [tab, setTab] = useState<"users" | "log">("users");
  return (
    <div>
      <div className="mb-4 flex gap-2" role="tablist">
        {([["users", "Users"], ["log", "Role changes"]] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`rounded-md border px-3 py-1.5 text-sm font-semibold ${tab === k ? "bg-primary text-primary-foreground" : "bg-card"}`}>{l}</button>
        ))}
      </div>
      {tab === "users" ? <UserList /> : <RoleChanges />}
      <CustomerOrdersDialog />
    </div>
  );
}

const RoleBadge = ({ role }: { role: UserKind }) => <span className={`rounded px-2 py-0.5 text-xs font-semibold ${role === "owner" ? "bg-primary text-primary-foreground" : role === "staff" ? "border border-foreground" : "border text-muted-foreground"}`}>{ROLE_LABEL[role]}</span>;

function UserList() {
  const fetchAll = useServerFn(listUsers);
  const save = useServerFn(setAdminRole);
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [role, setRole] = useState<UserKind | "all">("all");
  const navigate = useNavigate({ from: "/admin/users" });
  const view = (id: string) => navigate({ search: (p) => ({ ...p, viewUser: id }) });
  const { data = [], isLoading, error } = useQuery({ queryKey: ["admin", "users"], queryFn: () => fetchAll() });
  if (error) return <p className="text-destructive">{error.message}</p>;
  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  const counts = roleCounts(data);
  const rows = filterByRole(data, role).filter((u) => [u.email, u.profile?.full_name, u.profile?.phone].join(" ").toLowerCase().includes(q.toLowerCase()));
  const chips: [UserKind | "all", string, number][] = [["all", "All", counts.all], ["owner", "Owners", counts.owner], ["staff", "Staff", counts.staff], ["customer", "Customers", counts.customer]];
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {chips.map(([k, l, n]) => <button key={k} aria-pressed={role === k} onClick={() => setRole(k)} className={`rounded-full border px-3 py-1 text-xs font-semibold ${role === k ? "bg-primary text-primary-foreground" : "bg-card"}`}>{l} ({n})</button>)}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search email, name or phone…" className="w-full max-w-xs rounded-md border bg-card px-3 py-2" />
        <span className="text-sm text-muted-foreground">{rows.length} shown</span>
      </div>
      <div className="mt-4 overflow-x-auto rounded-md border">
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="bg-muted text-left font-display text-xs uppercase">
            <tr>{["Role", "Email", "Name", "Phone", "Region", "Motorcycle", "Contact", "Sign-in", "Signed up", "Last sign-in", "Orders", "Email", "Staff access (Admin)"].map((h, i) => <th key={i} className="px-3 py-2">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-3 py-2"><RoleBadge role={u.role} /></td>
                <td className="px-3 py-2"><button onClick={() => view(u.id)} className="text-left underline underline-offset-2">{u.email}</button></td>
                <td className="px-3 py-2">{u.profile?.full_name || "—"}</td>
                <td className="px-3 py-2">{u.profile?.phone || "—"}</td>
                <td className="px-3 py-2 capitalize">{[u.profile?.city, u.profile?.state, u.profile?.country].filter(Boolean).join(", ") || "—"}</td>
                <td className="px-3 py-2">{[u.profile?.motorcycle_make, u.profile?.motorcycle_model, u.profile?.motorcycle_plate].filter(Boolean).join(" · ") || "—"}</td>
                <td className="px-3 py-2 capitalize">{u.profile?.preferred_contact || "—"}</td>
                <td className="px-3 py-2 capitalize">{u.provider}</td>
                <td className="px-3 py-2">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-3 py-2">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : "—"}</td>
                <td className="px-3 py-2"><button onClick={() => view(u.id)} aria-label={`View purchases for ${u.email}`} className="rounded border px-2 py-0.5 text-xs font-semibold hover:bg-muted">{u.orders} verified</button></td>
                <td className="px-3 py-2">
                  <span className={u.email_confirmed ? "rounded border px-2 py-0.5 text-xs" : "rounded border border-dashed px-2 py-0.5 text-xs text-muted-foreground"}>{u.email_confirmed ? "Confirmed" : "Unconfirmed"}</span>
                </td>
                <td className="px-3 py-2">
                  {u.is_owner ? <span className="text-xs font-semibold">Owner</span> : (
                    <label title={!u.email_confirmed && !u.is_admin ? "Email must be confirmed first" : undefined} className="flex items-center gap-2">
                      <input type="checkbox" aria-label={`Staff access (Admin) for ${u.email}`} checked={u.is_admin} disabled={!u.is_admin && !u.email_confirmed} onChange={async (e) => {
                        try { await save({ data: { user_id: u.id, admin: e.target.checked } }); toast.success("Access updated"); qc.invalidateQueries({ queryKey: ["admin"] }); }
                        catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
                      }} />
                      Staff access (Admin)
                    </label>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RoleChanges() {
  const fetchLog = useServerFn(listRoleChanges);
  const [q, setQ] = useState("");
  const [action, setAction] = useState<"all" | "grant" | "remove">("all");
  const [offset, setOffset] = useState(0);
  const { data, isLoading, error, isFetching } = useQuery({ queryKey: ["admin", "role-changes", q, action, offset], queryFn: () => fetchLog({ data: { q, action, offset } }), placeholderData: keepPreviousData });
  const reset = () => setOffset(0);
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => { setQ(e.target.value); reset(); }} placeholder="Search email…" aria-label="Search role changes" className="w-full rounded-md border bg-card px-3 py-2 sm:max-w-xs" />
        <select aria-label="Action filter" value={action} onChange={(e) => { setAction(e.target.value as typeof action); reset(); }} className="rounded-md border bg-card px-2 py-2 text-sm">
          <option value="all">All</option><option value="grant">Granted</option><option value="remove">Removed</option>
        </select>
        {data && <span className="text-sm text-muted-foreground">{data.total} entries</span>}
      </div>
      {error ? <p className="mt-4 text-destructive">{error.message}</p> : isLoading ? <p className="mt-4 text-muted-foreground">Loading…</p> : !data?.entries.length ? <p className="mt-4 text-muted-foreground">No role changes recorded.</p> : (
        <ul className="mt-4 divide-y rounded-md border">
          {data.entries.map((e) => (
            <li key={e.id} className="grid gap-1 p-3 text-sm sm:grid-cols-[11rem_12rem_1fr_1fr] sm:items-center sm:gap-3">
              <span className="text-xs text-muted-foreground">{new Date(e.changed_at).toLocaleString()}</span>
              <span className="font-semibold">{e.action === "grant" ? "Staff access granted" : "Staff access removed"}</span>
              <span className={`break-all ${e.target_deleted ? "italic text-muted-foreground" : ""}`}><span className="text-xs text-muted-foreground sm:hidden">Account: </span>{e.target}</span>
              <span className={`break-all ${e.actor_deleted ? "italic text-muted-foreground" : ""}`}><span className="text-xs text-muted-foreground">By </span>{e.actor}{e.actor_role && <span className="ml-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary-foreground">{e.actor_role === "owner" ? "Owner" : "Staff"}</span>}</span>
            </li>
          ))}
        </ul>
      )}
      {data && data.entries.length < data.total && <button disabled={isFetching} onClick={() => setOffset(data.entries.length)} className="mt-3 rounded-md border px-4 py-2 text-sm font-semibold">{isFetching ? "Loading…" : `Load more (${ROLE_CHANGE_PAGE})`}</button>}
    </div>
  );
}

const money = (cur: string, v: number) => `${cur.toLowerCase() === "thb" ? "฿" : "RM "}${v.toFixed(2)}`;
const bkk = (iso: string) => new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Bangkok", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const ORDER_FILTERS = [["all", "All"], ["active", "Active"], ["completed", "Completed"], ["closed", "Rejected / Refunded"]] as const;
const inFilter = (status: string, f: (typeof ORDER_FILTERS)[number][0]) => f === "all" || (f === "active" ? ["pending_verification", "verified", "shipped", "received"].includes(status) : f === "completed" ? status === "completed" : ["rejected", "refunded"].includes(status));

function CustomerOrdersDialog() {
  const { viewUser } = Route.useSearch();
  const navigate = useNavigate({ from: "/admin/users" });
  const fetchOrders = useServerFn(getUserOrders);
  const [filter, setFilter] = useState<(typeof ORDER_FILTERS)[number][0]>("all");
  const [slip, setSlip] = useState<{ id: string; url: string } | null>(null);
  const [slipBusy, setSlipBusy] = useState<string | null>(null);
  const getSlipLink = useReceiptLink();
  const toggleSlip = async (id: string) => {
    if (slip?.id === id) { setSlip(null); return; }
    setSlipBusy(id);
    try { setSlip({ id, url: await getSlipLink(id) }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not open the payment slip"); }
    finally { setSlipBusy(null); }
  };
  const { data, isLoading, error } = useQuery({ queryKey: ["admin", "user-orders", viewUser], queryFn: () => fetchOrders({ data: { user_id: viewUser! } }), enabled: !!viewUser });
  const close = () => { setFilter("all"); navigate({ search: ({ viewUser: _v, ...rest }) => rest }); };
  const p = data?.profile;
  const orders = (data?.orders ?? []).filter((o) => inFilter(o.status, filter));
  return (
    <Dialog open={!!viewUser} onOpenChange={(v) => !v && close()}>
      <DialogContent className="max-h-[90dvh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto rounded-lg">
        <DialogHeader><DialogTitle>{p?.full_name || data?.user.email || "Customer"}</DialogTitle></DialogHeader>
        {error ? <p className="text-destructive">{error.message}</p> : isLoading || !data ? <p className="text-muted-foreground">Loading…</p> : (
          <div className="space-y-4 text-sm">
            <div className="space-y-1 text-muted-foreground">
              <p className="break-all">{data.user.email} · {data.user.email_confirmed ? "Confirmed" : "Unconfirmed"}{p?.phone ? ` · ${p.phone}` : ""}</p>
              {p && [p.address, p.city, p.state, p.postcode, p.country].some(Boolean) && <p>{[p.address, p.city, p.state, p.postcode, p.country].filter(Boolean).join(", ")}</p>}
              {p && [p.motorcycle_make, p.motorcycle_model, p.motorcycle_plate].some(Boolean) && <p>Motorcycle: {[p.motorcycle_make, p.motorcycle_model, p.motorcycle_plate].filter(Boolean).join(" · ")}</p>}
              <p>Signed up {bkk(data.user.created_at)} (Bangkok time)</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md border p-3"><p className="text-xs uppercase text-muted-foreground">Spent in RM</p><p className="font-display text-lg font-bold">{money("myr", data.spend.myr)}</p><p className="text-xs text-muted-foreground">{data.spend.myrOrders} verified orders</p></div>
              <div className="rounded-md border p-3"><p className="text-xs uppercase text-muted-foreground">Spent in THB</p><p className="font-display text-lg font-bold">{money("thb", data.spend.thb)}</p><p className="text-xs text-muted-foreground">{data.spend.thbOrders} verified orders</p></div>
            </div>
            <p className="text-xs text-muted-foreground">Spend counts verified, shipped, received and completed orders only. Refunded and rejected orders are listed but not counted.</p>
            <div className="flex flex-wrap gap-2">{ORDER_FILTERS.map(([k, l]) => <button key={k} aria-pressed={filter === k} onClick={() => setFilter(k)} className={`rounded-full border px-3 py-1 text-xs font-semibold ${filter === k ? "bg-primary text-primary-foreground" : "bg-card"}`}>{l}</button>)}</div>
            {!orders.length ? <p className="rounded-md border p-6 text-center text-muted-foreground">No orders.</p> : (
              <ul className="space-y-3">{orders.map((o) => {
                const t = trackingInfo(o);
                return (
                  <li key={o.id} className="rounded-md border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono font-semibold">{o.order_number}</span>
                      <span className="rounded border px-2 py-0.5 text-xs font-semibold uppercase">{o.status.replace(/_/g, " ")}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{bkk(o.created_at)} · {o.source === "member" ? "Member order" : "Guest checkout (email match)"}</p>
                    <ul className="mt-2 space-y-0.5">{o.items.map((i, n) => <li key={n} className="flex justify-between gap-3"><span>{i.product_name}{i.selected_variant ? ` (${i.selected_variant})` : ""} × {i.quantity}</span><span className="whitespace-nowrap">{money(o.currency, i.unit_price * i.quantity)}</span></li>)}</ul>
                    <div className="mt-2 space-y-0.5 border-t pt-2 text-xs">
                      {o.discount > 0 && <p className="flex justify-between"><span>Discounts{o.promo_code ? ` (${o.promo_code})` : ""}</span><span>−{money(o.currency, o.discount)}</span></p>}
                      <p className="flex justify-between"><span>Shipping</span><span>{money(o.currency, o.shipping_fee)}</span></p>
                      <p className="flex justify-between text-sm font-semibold"><span>Total</span><span>{money(o.currency, o.total_amount)}</span></p>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {t ? <a href={t.url} target="_blank" rel="noreferrer" className="rounded border px-2 py-1 font-semibold underline-offset-2 hover:underline">{t.courier}: {t.trackingNumber} ↗</a> : <span className="text-muted-foreground">No tracking yet</span>}
                      {o.has_receipt && <button aria-expanded={slip?.id === o.id} disabled={slipBusy === o.id} onClick={() => { void toggleSlip(o.id); }} className={`rounded border px-2 py-1 font-semibold ${slip?.id === o.id ? "bg-primary text-primary-foreground" : ""}`}>{slipBusy === o.id ? "Loading…" : slip?.id === o.id ? "Hide payment slip" : "View payment slip"}</button>}
                    </div>
                    {slip?.id === o.id && <div className="mt-2 rounded-md border p-2"><button type="button" onClick={() => setSlip(null)} aria-label="Close payment slip" className="block w-full cursor-pointer"><img src={slip.url} alt={`Payment slip for ${o.order_number}`} className="max-h-[420px] w-full rounded bg-muted object-contain" /></button><div className="mt-1 flex justify-between text-xs"><span className="text-muted-foreground">Tap image to close</span><ReceiptLink orderId={o.id} className="underline">Open full size ↗</ReceiptLink></div></div>}
                  </li>
                );
              })}</ul>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
