import { createServerFn } from "@tanstack/react-start";
import { emailMatches, LOOKUP_LIMITED, LOOKUP_LIMITS, LOOKUP_NOT_FOUND, lookupBlocked, OrderLookupSchema, type LookupResult } from "./order-lookup";

async function sha256(v: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Public order lookup: returns status and courier tracking only (no address, phone, prices or private link).
 * Wrong guesses are logged as hashes and limited per device, per email and per order number.
 */
export const lookupOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => OrderLookupSchema.parse(d))
  .handler(async ({ data }): Promise<LookupResult> => {
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ip = getRequestHeader("cf-connecting-ip") || getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() || "";
    const [clientHash, emailHash] = await Promise.all([ip ? sha256(`ip:${ip}`) : Promise.resolve(""), sha256(`email:${data.email}`)]);
    const since = new Date(Date.now() - LOOKUP_LIMITS.windowMs).toISOString();
    const failed = () => supabaseAdmin.from("order_lookup_attempts").select("id", { count: "exact", head: true }).eq("matched", false).gte("created_at", since);
    const [byClient, byEmail, byOrder] = await Promise.all([
      clientHash ? failed().eq("client_hash", clientHash) : Promise.resolve({ count: null }),
      failed().eq("email_hash", emailHash),
      failed().eq("order_number", data.ref),
    ]);
    if (lookupBlocked({ client: clientHash ? byClient.count ?? 0 : null, email: byEmail.count ?? 0, order: byOrder.count ?? 0 })) return { ok: false, message: LOOKUP_LIMITED };

    const { data: o } = await supabaseAdmin.from("orders")
      .select("order_number,created_at,status,currency,guest_email,tracking_number,shipping_address,order_items(product_name,selected_variant,quantity)")
      .eq("order_number", data.ref).maybeSingle();
    const matched = !!o && emailMatches(o.guest_email, data.email);
    await supabaseAdmin.from("order_lookup_attempts").insert({ client_hash: clientHash || "unknown", email_hash: emailHash, order_number: data.ref, matched });
    if (!o || !matched) return { ok: false, message: LOOKUP_NOT_FOUND };
    const addr = (o.shipping_address ?? {}) as { country?: string };
    return {
      ok: true,
      order: {
        order_number: o.order_number, created_at: o.created_at, status: o.status, currency: o.currency,
        country: addr.country ?? null, tracking_number: o.tracking_number ?? null,
        items: ((o.order_items ?? []) as { product_name: string; selected_variant: string | null; quantity: number }[]).map((i) => ({ product_name: i.product_name, selected_variant: i.selected_variant, quantity: i.quantity })),
      },
    };
  });
