CREATE TABLE public.traffic_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_hash text NOT NULL,
  path text NOT NULL,
  referrer text NOT NULL DEFAULT 'direct',
  device_type text NOT NULL DEFAULT 'desktop',
  country text NOT NULL DEFAULT 'Other',
  event_type text NOT NULL DEFAULT 'page_view',
  product_slug text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.traffic_events TO service_role;
ALTER TABLE public.traffic_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX traffic_events_created_idx ON public.traffic_events (created_at DESC);
CREATE INDEX traffic_events_visitor_idx ON public.traffic_events (visitor_hash, created_at);