import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/hooks/use-i18n";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { MailCheck, Search } from "lucide-react";
import { lookupOrder } from "@/lib/order-lookup.functions";
import { OrderLookupSchema, LOOKUP_LIMITED, LOOKUP_SENT } from "@/lib/order-lookup";
import { buildOrderWhatsAppUrl } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/whatsapp-icon";

export const Route = createFileRoute("/track")({ staticData: { sitemap: false },
  validateSearch: (s: Record<string, unknown>): { ref?: string } => (typeof s["ref"] === "string" ? { ref: s["ref"] } : {}),
  head: () => ({
    meta: [
      { title: "Track your order — Kopi Malay x Route 1" },
      { name: "description", content: "Get a private link to your Kopi Malay order status and J&T or Flash Express tracking number, sent to your checkout email." },
      { property: "og:title", content: "Track your order — Kopi Malay x Route 1" },
      { property: "og:description", content: "Order status and courier tracking for Kopi Malay merchandise." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TrackPage,
});

const field = "w-full rounded-md border bg-card px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring";

function TrackPage() {
  const search = Route.useSearch();
  const lookup = useServerFn(lookupOrder);
  const { t } = useI18n();
  const [ref, setRef] = useState(search.ref?.toUpperCase() ?? "");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const parsed = OrderLookupSchema.safeParse({ ref, email });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? t("tr.checkDetails")); return; }
    setBusy(true); setError(null); setSent(null);
    try {
      const r = await lookup({ data: { ref: parsed.data.ref, email: parsed.data.email } });
      if (r.ok) setSent(r.message === LOOKUP_SENT ? t("tr.sent") : r.message); else setError(r.message === LOOKUP_LIMITED ? t("tr.limited") : r.message);
    } catch {
      setError(t("tr.error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold uppercase md:text-4xl">{t("tr.title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("tr.intro")} <Link to="/profile" className="underline">{t("header.profile")}</Link>.</p>
      <form onSubmit={submit} className="mt-6 space-y-4 rounded-lg border p-5" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="tr-ref" className="text-sm font-medium">{t("tr.ref")}</label>
          <input id="tr-ref" value={ref} onChange={(e) => setRef(e.target.value.toUpperCase())} autoCapitalize="characters" placeholder="KM-12345" maxLength={20} className={`${field} font-mono`} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="tr-email" className="text-sm font-medium">{t("tr.email")}</label>
          <input id="tr-email" type="email" autoCapitalize="none" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" maxLength={254} className={field} />
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 font-display font-semibold uppercase text-primary-foreground disabled:opacity-50">
          <Search className="size-4" />{busy ? t("tw.sending") : t("tr.submit")}
        </button>
      </form>

      {sent && (
        <section className="mt-6 space-y-3 rounded-lg border p-5" aria-live="polite">
          <p className="flex items-center gap-2 font-semibold"><MailCheck className="size-5" />{t("tr.checkEmail")}</p>
          <p className="text-sm text-muted-foreground">{sent}</p>
          <a href={buildOrderWhatsAppUrl(ref)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium underline"><WhatsAppIcon className="size-4" />{t("tr.noEmail")}</a>
        </section>
      )}

      <div className="mt-8 rounded-lg bg-muted p-4 text-sm">
        <p className="font-semibold">{t("tr.whenQ")}</p>
        <p className="mt-1 text-muted-foreground">{t("tr.whenA")}</p>
      </div>
    </div>
  );
}
