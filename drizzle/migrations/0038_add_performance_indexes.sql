CREATE INDEX IF NOT EXISTS orders_user_created_idx ON public.orders (user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS orders_created_idx ON public.orders (created_at DESC, id);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS order_items_product_idx ON public.order_items (product_id) WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS products_active_category_idx ON public.products (category_id) WHERE is_active;
CREATE INDEX IF NOT EXISTS shared_stock_links_variant_idx ON public.shared_stock_links (loyverse_variant_id);