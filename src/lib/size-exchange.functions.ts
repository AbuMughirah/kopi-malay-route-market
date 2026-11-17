import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { canChangeSize, MAX_SIZE_CHANGES, sizeChoices, SIZE_CHANGE_ERRORS } from "./size-exchange";

type Ctx = { supabase: import("@supabase/supabase-js").SupabaseClient; userId: string; claims?: { email?: string } };

export type SizeOption = { itemId: string; name: string; current: string; quantity: number; choices: { size: string; left: number | null; disabled: boolean }[] };

/** Apparel lines on the caller's own pending order, with the sizes they may switch to. */
export const getSizeOptions = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<SizeOption[]> => {
    const ctx = context as unknown as Ctx;
    // RLS: the caller can only read their own order.
    const { data: o } = await ctx.supabase.from("orders").select("status,user_id,order_items(id,product_id,product_name,selected_variant,quantity)").eq("id", data.orderId).maybeSingle();
    if (!o || o.user_id !== ctx.userId || !canChangeSize(o.status)) return [];
    const items = (o.order_items ?? []) as { id: string; product_id: string | null; product_name: string; selected_variant: string; quantity: number }[];
    const ids = items.flatMap((i) => (i.product_id ? [i.product_id] : []));
    if (!ids.length) return [];
    const [{ data: products }, { data: stock }] = await Promise.all([
      ctx.supabase.from("products").select("id,variants").in("id", ids),
      ctx.supabase.from("product_stock").select("product_id,size,in_stock").in("product_id", ids),
    ]);
    return items.flatMap((i) => {
      const sizes = ((products?.find((p) => p.id === i.product_id)?.variants ?? {}) as { sizes?: string[] }).sizes ?? [];
      if (!sizes.length || !i.selected_variant) return [];
      const rows = (stock ?? []).filter((s) => s.product_id === i.product_id);
      const counts = rows.length ? Object.fromEntries(rows.map((r) => [r.size, r.in_stock])) : null;
      const taken = items.filter((x) => x.product_id === i.product_id && x.id !== i.id).map((x) => x.selected_variant);
      return [{ itemId: i.id, name: i.product_name, current: i.selected_variant, quantity: i.quantity, choices: sizeChoices({ sizes, current: i.selected_variant, taken, stock: counts, quantity: i.quantity }) }];
    });
  });

export const changeItemSize = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ orderId: z.string().uuid(), itemId: z.string().uuid(), size: z.string().trim().min(1).max(10) }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true } | { ok: false; error: string }> => {
    const ctx = context as unknown as Ctx;
    const fail = (code: string) => ({ ok: false as const, error: SIZE_CHANGE_ERRORS[code] ?? "Could not change the size. Please try again." });
    const { data: o } = await ctx.supabase.from("orders").select("order_number,status,user_id,shipping_address,order_items(id,product_id,product_name,selected_variant,quantity)").eq("id", data.orderId).maybeSingle();
    if (!o || o.user_id !== ctx.userId) return fail("not_found");
    if (!canChangeSize(o.status)) return fail("locked");
    const item = (o.order_items ?? []).find((i) => i.id === data.itemId);
    if (!item?.product_id) return fail("not_found");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: product }, { data: stock }] = await Promise.all([
      supabaseAdmin.from("products").select("variants").eq("id", item.product_id).single(),
      supabaseAdmin.from("product_stock").select("size,in_stock,loyverse_variant_id").eq("product_id", item.product_id),
    ]);
    const sizes = ((product?.variants ?? {}) as { sizes?: string[] }).sizes ?? [];
    if (!sizes.includes(data.size)) return fail("not_apparel");
    const target = stock?.find((s) => s.size === data.size);
    if (stock?.length && (!target || target.in_stock < item.quantity)) return fail("sold_out");
    const old = stock?.find((s) => s.size === item.selected_variant);
    const { data: res, error } = await supabaseAdmin.rpc("customer_change_item_size", {
      _order: data.orderId, _item: data.itemId, _user: ctx.userId, _email: ctx.claims?.email ?? "", _size: data.size,
      _old_variant: old?.loyverse_variant_id ?? "", _new_variant: target?.loyverse_variant_id ?? "", _max: MAX_SIZE_CHANGES,
    });
    if (error) { console.error("Size change failed", error); return fail("error"); }
    if (res !== "ok") return fail(String(res));
    try {
      const { sendTelegram, escHtml } = await import("./telegram.server");
      const addr = (o.shipping_address ?? {}) as { name?: string; country?: string };
      await sendTelegram([
        `👕 <b>Size change: ${escHtml(o.order_number)}</b>`,
        `• Customer: ${escHtml(addr.name ?? "")}${addr.country ? ` (${escHtml(addr.country)})` : ""}`,
        `• Item: ${escHtml(item.product_name)} × ${item.quantity}`,
        `• Size: ${escHtml(item.selected_variant)} ➔ ${escHtml(data.size)}`,
        `• Status: Pending Verification — no payment change`,
      ].join("\n"), "size-change");
    } catch (e) { console.error("Size change alert failed", e); }
    return { ok: true };
  });
