import { createServerFn } from "@tanstack/react-start";
import { emailMatches, LOOKUP_LIMITED, LOOKUP_LIMITS, LOOKUP_SENT, lookupBlocked, OrderLookupSchema, shouldSendTrackingLink, type LookupResult } from "./order-lookup";

async function sha256(v: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Public "track my order" request. It never returns order data to the caller: when the order number and
 * checkout email match, the private status link is emailed to the order's saved address, so only the
 * inbox owner can open it. The reply is identical for matches and misses. Wrong guesses are logged as
 * hashes and limited per device, email and order; emailed links are capped per order per hour.
 */
export const lookupOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => OrderLookupSchema.parse(d))
  .handler(async ({ data }): Promise<LookupResult> => {
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ip = getRequestHeader("cf-connecting-ip") || getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() || "";
    const [clientHash, emailHash] = await Promise.all([ip ? sha256(`ip:${ip}`) : Promise.resolve(""), sha256(`email:${data.email}`)]);
    const since = new Date(Date.now() - LOOKUP_LIMITS.windowMs).toISOString();
    const attempts = (matched: boolean) => supabaseAdmin.from("order_lookup_attempts").select("id", { count: "exact", head: true }).eq("matched", matched).gte("created_at", since);
    const [byClient, byEmail, byOrder] = await Promise.all([
      clientHash ? attempts(false).eq("client_hash", clientHash) : Promise.resolve({ count: null }),
      attempts(false).eq("email_hash", emailHash),
      attempts(false).eq("order_number", data.ref),
    ]);
    if (lookupBlocked({ client: clientHash ? byClient.count ?? 0 : null, email: byEmail.count ?? 0, order: byOrder.count ?? 0 })) return { ok: false, message: LOOKUP_LIMITED };

    const { data: o } = await supabaseAdmin.from("orders")
      .select("id,order_number,guest_email,access_token,shipping_address")
      .eq("order_number", data.ref).maybeSingle();
    const matched = !!o && emailMatches(o.guest_email, data.email);
    const recentSends = matched ? (await attempts(true).eq("order_number", data.ref)).count ?? 0 : 0;
    await supabaseAdmin.from("order_lookup_attempts").insert({ client_hash: clientHash || "unknown", email_hash: emailHash, order_number: data.ref, matched });

    if (o && o.guest_email && shouldSendTrackingLink({ matched, hasToken: !!o.access_token, recentSends })) {
      try {
        const { sendTemplateEmail } = await import("./email-templates/send-email");
        const addr = (o.shipping_address ?? {}) as { name?: string; full_name?: string };
        const link = `https://kopimalay.com/order-success?ref=${encodeURIComponent(o.order_number)}&t=${o.access_token}`;
        // Recipient is always the order's saved checkout email, never the request input.
        await sendTemplateEmail("order-tracking-link", o.guest_email.trim(), {
          templateData: { name: addr.name ?? addr.full_name ?? "", orderNumber: o.order_number, link },
          idempotencyKey: `order-tracking-link-${o.id}-${recentSends}-${Math.floor(Date.now() / LOOKUP_LIMITS.windowMs)}`,
        });
      } catch (e) {
        console.error("Order tracking link email failed", e instanceof Error ? e.message : "unknown error");
      }
    }
    return { ok: true, message: LOOKUP_SENT };
  });
