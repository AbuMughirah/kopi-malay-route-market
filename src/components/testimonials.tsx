import { useI18n } from "@/hooks/use-i18n";
import { useEffect, useRef, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import r1 from "@/assets/review-1.jpg.asset.json";
import r2 from "@/assets/review-2.jpg.asset.json";
import r3 from "@/assets/review-3.jpg.asset.json";
import r4 from "@/assets/review-4.jpg.asset.json";
import r5 from "@/assets/review-5.jpg.asset.json";
import r6 from "@/assets/review-6.jpg.asset.json";
import r7 from "@/assets/review-7.jpg.asset.json";
import r8 from "@/assets/review-8.jpg.asset.json";
import r9 from "@/assets/review-9.jpg.asset.json";
import r10 from "@/assets/review-10.jpg.asset.json";

const reviews = [r1, r2, r3, r4, r5, r6, r7, r8, r9, r10];

export function Testimonials() {
  const { t } = useI18n();
  const [open, setOpen] = useState<number | null>(null);
  const [current, setCurrent] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open === null) return;
    setCurrent(open);
    const t = setTimeout(() => {
      const el = track.current;
      if (el) el.scrollTo({ left: el.clientWidth * open, behavior: "instant" as ScrollBehavior });
    }, 30);
    return () => clearTimeout(t);
  }, [open]);

  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    const n = Math.max(0, Math.min(reviews.length - 1, i));
    el.scrollTo({ left: el.clientWidth * n, behavior: "smooth" });
  };

  return (
    <section className="border-t bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="font-display text-2xl font-bold uppercase md:text-3xl">{t("rev.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("rev.subtitle")}</p>
        <div className="mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 md:gap-5">
          {reviews.map((r, i) => (
            <button
              key={r.asset_id}
              type="button"
              onClick={() => setOpen(i)}
              className="w-44 shrink-0 snap-start overflow-hidden rounded-md border bg-muted md:w-56"
              aria-label={`Open rider review ${i + 1}`}
            >
              <img src={r.url} alt={`Rider review ${i + 1}`} loading="lazy" decoding="async" className="aspect-[3/5] w-full object-cover object-top" />
            </button>
          ))}
        </div>
      </div>
      <Dialog open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-md p-2">
          <DialogTitle className="sr-only">Rider review</DialogTitle>
          <div
            ref={track}
            onScroll={(e) => {
              const el = e.currentTarget;
              setCurrent(Math.round(el.scrollLeft / el.clientWidth));
            }}
            className={`flex snap-x snap-mandatory ${zoomed ? "overflow-hidden" : "overflow-x-auto"}`}
          >
            {reviews.map((r, i) => (
              <div key={r.asset_id} className="w-full shrink-0 snap-center">
                <TransformWrapper
                  doubleClick={{ mode: "toggle" }}
                  panning={{ disabled: !zoomed }}
                  onTransform={(_, s) => i === current && setZoomed(s.scale > 1.01)}
                >
                  <TransformComponent wrapperClass="!w-full" contentClass="!w-full">
                    <img src={r.url} alt={`Rider review ${i + 1}`} loading="lazy" decoding="async" className="max-h-[78vh] w-full object-contain" />
                  </TransformComponent>
                </TransformWrapper>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between px-1 pt-1">
            <button type="button" onClick={() => go(current - 1)} disabled={current === 0} className="rounded-full border p-2 disabled:opacity-30" aria-label={t("rev.prev")}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-muted-foreground">{current + 1} / {reviews.length}</span>
            <button type="button" onClick={() => go(current + 1)} disabled={current === reviews.length - 1} className="rounded-full border p-2 disabled:opacity-30" aria-label={t("rev.next")}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
