import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";
import { PENDING_PROMO_KEY, WELCOME_CODE } from "@/lib/promo";
import loop from "@/assets/mae-hong-son-loop.avif.asset.json";

export const WELCOME_TITLE = "Receive 5% Discount When You Sign Up!";
const SEEN_KEY = "km_welcome_popup_seen";
const stage = () => localStorage.setItem(PENDING_PROMO_KEY, WELCOME_CODE);

function CodeChip() {
  const copy = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation(); stage();
    try { await navigator.clipboard.writeText(WELCOME_CODE); toast.success(`Promo code ${WELCOME_CODE} copied`); }
    catch { toast(`Your code: ${WELCOME_CODE}`); }
  };
  return (
    <button type="button" onClick={copy} className="inline-flex items-center gap-2 rounded-md border-2 border-dashed border-current px-4 py-2 font-mono text-sm font-bold">
      CODE: {WELCOME_CODE} <span className="font-sans text-xs font-normal underline">Copy</span>
    </button>
  );
}

export function WelcomeBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-12">
      <Link to="/auth" search={{ mode: "signup" }} onClick={stage} className="grid overflow-hidden rounded-lg bg-ink text-ink-foreground md:grid-cols-2">
        <img src={loop.url} alt="Mae Hong Son Loop curves" loading="lazy" className="h-auto w-full" />
        <div className="flex flex-col items-center justify-center gap-4 p-6 text-center md:p-10">
          <h2 className="font-display text-2xl font-bold uppercase md:text-4xl lg:text-5xl">{WELCOME_TITLE}</h2>
          <CodeChip />
          <span className="rounded-md bg-background px-6 py-3 font-display font-semibold uppercase text-foreground">Create account</span>
        </div>
      </Link>
    </section>
  );
}

/** First-visit popup: guests only, after 4s, shown once per device. */
export function WelcomePopup() {
  const { user } = useCart();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (user || localStorage.getItem(SEEN_KEY)) return;
    const t = setTimeout(() => setOpen(true), 4000);
    return () => clearTimeout(t);
  }, [user]);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && dismiss();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);
  function dismiss() { localStorage.setItem(SEEN_KEY, "1"); setOpen(false); }
  if (!open || user) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4" onClick={dismiss} role="dialog" aria-modal="true" aria-label={WELCOME_TITLE}>
      <div className="relative max-h-[95vh] w-full max-w-md overflow-y-auto rounded-lg bg-background" onClick={(e) => e.stopPropagation()}>
        <button aria-label="Close" onClick={dismiss} className="absolute right-2 top-2 z-10 grid size-10 place-items-center rounded-full bg-background/90 text-foreground"><X className="size-5" /></button>
        <img src={loop.url} alt="Mae Hong Son Loop curves" className="mx-auto block max-h-[40vh] w-auto bg-ink object-contain" />
        <div className="p-6 text-center">
          <h2 className="font-display text-2xl font-bold uppercase">{WELCOME_TITLE}</h2>
          <p className="mt-2 text-sm text-muted-foreground">Members get 5% off their first order. Applied automatically at checkout.</p>
          <div className="mt-4"><CodeChip /></div>
          <Link to="/auth" search={{ mode: "signup" }} onClick={() => { stage(); dismiss(); }} className="mt-5 block rounded-md bg-foreground px-6 py-3 font-display font-semibold uppercase text-background">Create account</Link>
        </div>
      </div>
    </div>
  );
}
