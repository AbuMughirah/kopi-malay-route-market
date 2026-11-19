import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { MailCheck, Search } from "lucide-react";
import { lookupOrder } from "@/lib/order-lookup.functions";
import { OrderLookupSchema } from "@/lib/order-lookup";
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
  const [ref, setRef] = useState(search.ref?.toUpperCase() ?? "");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const parsed = OrderLookupSchema.safeParse({ ref, email });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Check your details."); return; }
    setBusy(true); setError(null); setSent(null);
    try {
      const r = await lookup({ data: { ref: parsed.data.ref, email: parsed.data.email } });
      if (r.ok) setSent(r.message); else setError(r.message);
    } catch {
      setError("Something went wrong. Please try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold uppercase md:text-4xl">Track your order</h1>
      <p className="mt-2 text-muted-foreground">Enter your order number and the email you used at checkout — we'll email you a private link to its status and tracking. Members can also see every order under <Link to="/profile" className="underline">My profile</Link>.</p>
      <form onSubmit={submit} className="mt-6 space-y-4 rounded-lg border p-5" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="tr-ref" className="text-sm font-medium">Order number</label>
          <input id="tr-ref" value={ref} onChange={(e) => setRef(e.target.value.toUpperCase())} autoCapitalize="characters" placeholder="KM-12345" maxLength={20} className={`${field} font-mono`} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="tr-email" className="text-sm font-medium">Checkout email</label>
          <input id="tr-email" type="email" autoCapitalize="none" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" maxLength={254} className={field} />
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 font-display font-semibold uppercase text-primary-foreground disabled:opacity-50">
          <Search className="size-4" />{busy ? "Sending…" : "Email me my tracking link"}
        </button>
      </form>

      {sent && (
        <section className="mt-6 space-y-3 rounded-lg border p-5" aria-live="polite">
          <p className="flex items-center gap-2 font-semibold"><MailCheck className="size-5" />Check your email</p>
          <p className="text-sm text-muted-foreground">{sent}</p>
          <a href={buildOrderWhatsAppUrl(ref)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium underline"><WhatsAppIcon className="size-4" />No email? Ask us on WhatsApp</a>
        </section>
      )}

      <div className="mt-8 rounded-lg bg-muted p-4 text-sm">
        <p className="font-semibold">When will I get a tracking number?</p>
        <p className="mt-1 text-muted-foreground">After we verify your payment, orders usually ship within 1–3 working days. We email your tracking number the moment it ships — Malaysia orders go by J&amp;T Express, Thailand orders by Flash Express.</p>
      </div>
    </div>
  );
}
