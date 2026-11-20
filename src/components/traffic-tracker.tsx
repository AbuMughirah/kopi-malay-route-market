import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { recordVisit } from "@/lib/analytics.functions";
import { eventFor, isTrackablePath } from "@/lib/analytics";

/** Fire-and-forget page tracking; never blocks navigation or checkout. */
export function TrafficTracker() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const first = useRef(true);
  useEffect(() => {
    if (!isTrackablePath(path) || eventFor(path).event === "order_completed") return; // recorded by the order page once confirmed
    const referrer = first.current ? document.referrer : "";
    first.current = false;
    const send = () => { void recordVisit({ data: { path, referrer } }).catch(() => {}); };
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => void };
    if (w.requestIdleCallback) w.requestIdleCallback(send); else setTimeout(send, 300);
  }, [path]);
  return null;
}
