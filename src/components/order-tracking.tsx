import { useState } from "react";
import { Check, Copy, ExternalLink, PackageCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { courierFor, trackingHint, trackingInfo, trackingStage } from "@/lib/tracking";

type Props = { status: string; country?: string | null | undefined; currency?: string | null | undefined; tracking_number?: string | null | undefined; compact?: boolean };

/** Where-is-my-parcel card: courier, tracking number with copy, and a direct link to the courier's own tracking page. */
export function OrderTracking({ status, country, currency, tracking_number, compact }: Props) {
  const [copied, setCopied] = useState(false);
  const stage = trackingStage(status);
  if (stage === "closed") return null;
  const courier = courierFor({ country, currency });
  const info = trackingInfo({ country, currency, tracking_number });
  const hint = trackingHint(status, courier.name);

  if (!info) {
    return hint ? (
      <div className={`flex gap-3 rounded-lg border border-dashed ${compact ? "p-3" : "p-4"} text-sm`}>
        <Truck className="mt-0.5 size-5 shrink-0" aria-hidden />
        <p>{hint}</p>
      </div>
    ) : null;
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(info.trackingNumber);
      setCopied(true);
      toast.success("Tracking number copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — please select the number and copy it manually.");
    }
  };

  return (
    <div className={`rounded-lg border-2 border-foreground ${compact ? "p-3" : "p-4"} text-sm`}>
      <div className="flex items-center gap-2 font-display font-bold uppercase">
        {stage === "delivered" ? <PackageCheck className="size-5" aria-hidden /> : <Truck className="size-5" aria-hidden />}
        {stage === "delivered" ? "Delivered" : "Your parcel is on the way"}
      </div>
      <dl className="mt-3 grid gap-1">
        <div className="flex flex-wrap gap-x-2"><dt className="text-muted-foreground">Courier</dt><dd className="font-semibold">{info.courier}</dd></div>
        <div className="flex flex-wrap items-center gap-x-2"><dt className="text-muted-foreground">Tracking no.</dt><dd className="break-all font-mono font-semibold">{info.trackingNumber}</dd></div>
      </dl>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={copy} className="flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 font-display text-sm font-semibold uppercase">
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}{copied ? "Copied" : "Copy number"}
        </button>
        <a href={info.url} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 font-display text-sm font-semibold uppercase text-primary-foreground">
          Track on {info.courier} <ExternalLink className="size-4" />
        </a>
      </div>
      {!compact && <p className="mt-3 text-xs text-muted-foreground">Delivery updates come straight from {info.courier}. It can take up to 24 hours after shipping for the first scan to appear.</p>}
    </div>
  );
}
