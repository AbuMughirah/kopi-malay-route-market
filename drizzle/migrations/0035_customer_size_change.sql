CREATE OR REPLACE FUNCTION public.customer_change_item_size(_order uuid, _item uuid, _user uuid, _email text, _size text, _old_variant text, _new_variant text, _max integer)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o public.orders; i public.order_items; changes integer;
BEGIN
  SELECT * INTO o FROM public.orders WHERE id = _order FOR UPDATE;
  IF NOT FOUND OR o.user_id IS DISTINCT FROM _user THEN RETURN 'not_found'; END IF;
  IF o.status <> 'pending_verification' THEN RETURN 'locked'; END IF;
  SELECT * INTO i FROM public.order_items WHERE id = _item AND order_id = _order FOR UPDATE;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;
  IF i.selected_variant = _size THEN RETURN 'same'; END IF;
  IF EXISTS (SELECT 1 FROM public.order_items WHERE order_id = _order AND product_id = i.product_id AND selected_variant = _size) THEN RETURN 'duplicate'; END IF;
  SELECT count(*) INTO changes FROM public.order_status_history WHERE order_id = _order AND notes LIKE 'Customer size change:%';
  IF changes >= _max THEN RETURN 'limit'; END IF;
  UPDATE public.order_items SET selected_variant = _size WHERE id = _item;
  UPDATE public.orders SET
    stock_deductions = COALESCE((SELECT jsonb_agg(CASE WHEN d->>'variantId' = _old_variant AND _new_variant <> '' THEN jsonb_set(d, '{variantId}', to_jsonb(_new_variant)) ELSE d END) FROM jsonb_array_elements(o.stock_deductions) d), '[]'::jsonb),
    pos_receipt_snapshot = CASE WHEN o.pos_receipt_snapshot IS NULL THEN NULL ELSE jsonb_set(o.pos_receipt_snapshot, '{items}', COALESCE((SELECT jsonb_agg(CASE WHEN x->>'product_id' = i.product_id::text AND x->>'variant' = i.selected_variant THEN jsonb_set(x, '{variant}', to_jsonb(_size)) ELSE x END) FROM jsonb_array_elements(o.pos_receipt_snapshot->'items') x), '[]'::jsonb)) END
  WHERE id = _order;
  INSERT INTO public.order_status_history(order_id, order_number, changed_by, changed_by_email, from_status, to_status, notes)
  VALUES (_order, o.order_number, _user, COALESCE(_email, ''), o.status, o.status, 'Customer size change: ' || i.product_name || ' × ' || i.quantity || ' from ' || i.selected_variant || ' to ' || _size);
  RETURN 'ok';
END $$;
REVOKE ALL ON FUNCTION public.customer_change_item_size(uuid, uuid, uuid, text, text, text, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.customer_change_item_size(uuid, uuid, uuid, text, text, text, text, integer) TO service_role;