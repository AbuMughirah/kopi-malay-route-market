import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { highestRole } from "./roles";
import type { IncomeOrder } from "./income";

/** Called only after the owner gate. Pagination prevents the old 1000-order report ceiling. */
export async function loadIncomeOrders(): Promise<IncomeOrder[]> {
  const orders: IncomeOrder[] = [];
  const { data: roles, error: rolesError } = await supabaseAdmin.from("user_roles").select("user_id,role");
  if (rolesError) throw new Error("Unable to load Income. Please retry.");
  for (let offset = 0; ; offset += 200) {
    const { data, error } = await supabaseAdmin.from("orders").select("id,user_id,order_number,created_at,status,pre_claim_status,currency,subtotal,sale_discount,sticker_bundle_discount,discount_amount,shipping_fee,total_amount,promo_code,payment_method,order_items(id,product_id,product_name,selected_variant,quantity,unit_price,products(categories(name,slug)))").order("created_at", { ascending: false }).order("id").range(offset, offset + 199);
    if (error) { console.error("Income read failed", error.message); throw new Error("Unable to load Income. Please retry."); }
    for (const o of data ?? []) {
      orders.push({ ...o, placed_by: o.user_id ? highestRole((roles ?? []).filter((r) => r.user_id === o.user_id).map((r) => r.role)) : "guest", items: (o.order_items ?? []).map((i) => ({ id: i.id, product_id: i.product_id, product_name: i.product_name, selected_variant: i.selected_variant, quantity: i.quantity, unit_price: i.unit_price, category_slug: i.products?.categories?.slug ?? "uncategorized", category: i.products?.categories?.name ?? "Uncategorized" })) });
    }
    if (!data || data.length < 200) break;
  }
  return orders;
}
