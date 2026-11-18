import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { OwnerPinButton } from "@/components/admin/OwnerPinDialog";

export const Route = createFileRoute("/_authenticated/admin")({ staticData: { sitemap: false },
  beforeLoad: async ({ context }) => {
    const { data } = await supabase.rpc("has_role", { _user_id: context.user.id, _role: "admin" });
    if (!data) throw redirect({ to: "/" });
  },
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Kopi Malay" },
      { name: "description", content: "Kopi Malay store administration." },
      { property: "og:title", content: "Admin Dashboard — Kopi Malay" },
      { property: "og:description", content: "Store administration." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const TABS = [
  { to: "/admin", label: "Orders", exact: true },
  { to: "/admin/income", label: "Income" },
  { to: "/admin/products", label: "Products & Stock" },
  { to: "/admin/promos", label: "Promo Codes" },
  { to: "/admin/towing", label: "Towing Requests" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/analytics", label: "Analytics" },
] as const;

function AdminLayout() {
  const { user } = Route.useRouteContext();
  const [isOwner, setIsOwner] = useState(false);
  useEffect(() => {
    supabase.rpc("has_role", { _user_id: user.id, _role: "owner" }).then(({ data }) => setIsOwner(Boolean(data)));
  }, [user.id]);
  const tabs = TABS.filter((t) => !["/admin/users", "/admin/income"].includes(t.to) || isOwner);
  return (
    <div className="mx-auto w-full max-w-[1400px] px-3 py-5 sm:px-6 sm:py-8">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h1 className="truncate font-display text-xl font-bold uppercase sm:text-3xl">Admin dashboard</h1>
        <OwnerPinButton />
      </div>
      <nav aria-label="Admin sections" className="sticky top-0 z-20 -mx-3 mt-4 border-b bg-background px-3 sm:mx-0 sm:px-0">
        <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((t) => (
            <Link key={t.to} to={t.to} activeOptions={{ exact: "exact" in t }} className="shrink-0 whitespace-nowrap border-b-2 border-transparent px-3 py-3 font-display text-xs font-semibold uppercase text-muted-foreground hover:text-foreground sm:text-sm [&.active]:border-foreground [&.active]:text-foreground">
              {t.label}
            </Link>
          ))}
        </div>
      </nav>
      <div className="mt-5 min-w-0 sm:mt-6 [&_table]:min-w-full">
        <Outlet />
      </div>
    </div>
  );
}
