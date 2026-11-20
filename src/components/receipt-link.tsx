import { useServerFn } from "@tanstack/react-start";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { getReceiptLink } from "@/lib/admin.functions";

/** Fetches a fresh, short-lived payment-slip link (role re-checked on the server) for each view. */
export function useReceiptLink() {
  const fetchLink = useServerFn(getReceiptLink);
  return (orderId: string) => fetchLink({ data: { order_id: orderId } }).then((r) => r.url);
}

/** Opens one order's payment slip in a new tab. The tab opens on click so phones don't block it as a pop-up. */
export function ReceiptLink({ orderId, className, children }: { orderId: string; className?: string; children: ReactNode }) {
  const getLink = useReceiptLink();
  const [busy, setBusy] = useState(false);
  const open = async () => {
    if (busy) return;
    const tab = window.open("about:blank", "_blank");
    setBusy(true);
    try {
      const url = await getLink(orderId);
      if (tab) { tab.opener = null; tab.location.href = url; } else window.location.href = url;
    } catch (e) {
      tab?.close();
      toast.error(e instanceof Error ? e.message : "Could not open the payment slip");
    } finally { setBusy(false); }
  };
  return <button type="button" onClick={() => { void open(); }} disabled={busy} className={className}>{busy ? "Opening…" : children}</button>;
}
