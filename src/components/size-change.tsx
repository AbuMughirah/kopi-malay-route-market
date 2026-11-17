import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { changeItemSize, getSizeOptions, type SizeOption } from "@/lib/size-exchange.functions";

/** Customer self-service apparel size change for an order still Pending Verification. Exchange only, no refund. */
export function SizeChange({ orderId, onChanged }: { orderId: string; onChanged: () => void }) {
  const load = useServerFn(getSizeOptions);
  const change = useServerFn(changeItemSize);
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<SizeOption[] | null>(null);
  const [pick, setPick] = useState<{ itemId: string; size: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const start = async () => {
    setOpen(true); setOptions(null); setPick(null);
    try { setOptions(await load({ data: { orderId } })); } catch { setOptions([]); }
  };
  const save = async () => {
    if (!pick) return;
    setBusy(true);
    try {
      const r = await change({ data: { orderId, ...pick } });
      if (r.ok) { toast.success("Size changed. Our team has been notified."); setOpen(false); onChanged(); }
      else toast.error(r.error);
    } catch { toast.error("Could not change the size. Please try again."); }
    setBusy(false);
  };

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={start}>Change size</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change apparel size</DialogTitle>
            <DialogDescription>Size exchange only, before your order is verified. The price stays the same. No cash refund or store credit.</DialogDescription>
          </DialogHeader>
          {options == null ? <p className="text-sm text-muted-foreground">Loading sizes…</p> : !options.length ? (
            <p className="text-sm text-muted-foreground">No sizes can be changed on this order. Please contact us on WhatsApp.</p>
          ) : (
            <div className="space-y-4">
              {options.map((o) => (
                <div key={o.itemId} className="space-y-2">
                  <p className="text-sm font-medium">{o.name} × {o.quantity} <span className="text-muted-foreground">(now Size {o.current})</span></p>
                  <div className="flex flex-wrap gap-2">
                    {o.choices.map((c) => {
                      const on = pick?.itemId === o.itemId && pick.size === c.size;
                      return (
                        <button key={c.size} type="button" disabled={c.disabled} aria-pressed={on} onClick={() => setPick({ itemId: o.itemId, size: c.size })}
                          className={`min-w-12 rounded-md border px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${on ? "border-foreground bg-foreground text-background" : ""}`}>
                          {c.size}{c.size !== o.current && c.left === 0 ? " · Sold out" : ""}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="button" disabled={!pick || busy} onClick={save}>{busy ? "Saving…" : "Confirm size change"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
