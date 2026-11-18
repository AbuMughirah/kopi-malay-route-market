import { useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
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
  const [open, setOpen] = useState<string | null>(null);
  return (
    <section className="border-t bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="font-display text-2xl font-bold uppercase md:text-3xl">What riders say</h2>
        <p className="mt-1 text-sm text-muted-foreground">Real feedback from riders</p>
        <div className="mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 md:gap-5">
          {reviews.map((r, i) => (
            <button
              key={r.asset_id}
              type="button"
              onClick={() => setOpen(r.url)}
              className="w-44 shrink-0 snap-start overflow-hidden rounded-md border bg-muted md:w-56"
              aria-label={`Open rider review ${i + 1}`}
            >
              <img src={r.url} alt={`Rider review ${i + 1}`} loading="lazy" className="aspect-[3/5] w-full object-cover object-top" />
            </button>
          ))}
        </div>
      </div>
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-md p-2">
          <DialogTitle className="sr-only">Rider review</DialogTitle>
          {open && (
            <TransformWrapper doubleClick={{ mode: "toggle" }}>
              <TransformComponent wrapperClass="!w-full" contentClass="!w-full">
                <img src={open} alt="Rider review" className="max-h-[80vh] w-full object-contain" />
              </TransformComponent>
            </TransformWrapper>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
