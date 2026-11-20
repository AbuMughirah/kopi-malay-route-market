import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { countryFor, deviceFor, eventFor, isBot, isFreshOrder, isTrackablePath, rangeStart, referrerFor, summarize, type Row } from "./analytics";

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Public, anonymous visit recorder. Never stores IPs; visitor id is a daily-salted hash. */
export const recordVisit = createServerFn({ method: "POST" })
  .inputValidator(z.object({ path: z.string().max(300), referrer: z.string().max(500), ref: z.string().max(40).optional(), token: z.string().max(64).optional() }))
  .handler(async ({ data }) => {
    try {
      const ua = getRequestHeader("user-agent") ?? "";
      const path = data.path.split(/[?#]/)[0]!;
      if (isBot(ua) || !isTrackablePath(path)) return { ok: true };
      const auth = getRequestHeader("authorization");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      if (auth?.startsWith("Bearer ")) {
        const { data: u } = await supabaseAdmin.auth.getUser(auth.slice(7));
        if (u.user) {
          const { data: staff } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", u.user.id).in("role", ["admin", "owner"]).limit(1);
          if (staff?.length) return { ok: true };
        }
      }
      const ip = getRequestHeader("cf-connecting-ip") ?? getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
      const day = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
      const visitor_hash = (await sha256(`${ip}|${ua}|${day}|${process.env["SUPABASE_URL"] ?? ""}`)).slice(0, 32);
      const { event } = eventFor(path);
      let { product } = eventFor(path);
      if (event === "order_completed") {
        // Count only a real, just-placed order, once per order (email/status revisits ignored).
        if (!data.ref || !data.token) return { ok: true };
        const { data: order } = await supabaseAdmin.from("orders").select("id, created_at").eq("order_number", data.ref).eq("access_token", data.token).maybeSingle();
        if (!order || !isFreshOrder(order.created_at)) return { ok: true };
        product = `order:${(await sha256(order.id)).slice(0, 16)}`;
        const { data: seen } = await supabaseAdmin.from("traffic_events").select("id").eq("event_type", "order_completed").eq("product_slug", product).limit(1);
        if (seen?.length) return { ok: true };
      }
      // Debounce: same visitor + same path within 10s is one hit.
      const since = new Date(Date.now() - 10_000).toISOString();
      const { data: dup } = await supabaseAdmin.from("traffic_events").select("id").eq("visitor_hash", visitor_hash).eq("path", path).gte("created_at", since).limit(1);
      if (dup?.length) return { ok: true };
      await supabaseAdmin.from("traffic_events").insert({
        visitor_hash, path, event_type: event, product_slug: product,
        referrer: referrerFor(data.referrer, getRequestHeader("host") ?? ""),
        device_type: deviceFor(ua), country: countryFor(getRequestHeader("cf-ipcountry")),
      });
    } catch (e) { console.error("recordVisit failed", e); }
    return { ok: true };
  });

export const getTrafficReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ range: z.enum(["today", "7d", "30d"]) }))
  .handler(async ({ data, context }) => {
    const { data: ok } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!ok) throw new Error("Forbidden: admin access required");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Retention: raw events older than 90 days are pruned opportunistically.
    await supabaseAdmin.from("traffic_events").delete().lt("created_at", new Date(Date.now() - 90 * 86400_000).toISOString());
    const rows: Row[] = [];
    const from = rangeStart(data.range).toISOString();
    for (let page = 0; page < 20; page++) {
      const { data: batch, error } = await supabaseAdmin.from("traffic_events").select("visitor_hash,event_type,referrer,device_type,country,product_slug").gte("created_at", from).order("created_at").range(page * 1000, page * 1000 + 999);
      if (error) throw new Error("Could not load traffic");
      rows.push(...(batch ?? []));
      if (!batch || batch.length < 1000) break;
    }
    return summarize(rows);
  });
