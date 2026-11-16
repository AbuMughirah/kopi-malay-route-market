CREATE TABLE public.order_lookup_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_hash text NOT NULL,
  email_hash text NOT NULL,
  order_number text NOT NULL,
  matched boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.order_lookup_attempts TO service_role;
ALTER TABLE public.order_lookup_attempts ENABLE ROW LEVEL SECURITY;
-- No policies: only the server (service role) reads or writes lookup attempts.
CREATE INDEX order_lookup_attempts_client_idx ON public.order_lookup_attempts (client_hash, created_at);
CREATE INDEX order_lookup_attempts_email_idx ON public.order_lookup_attempts (email_hash, created_at);
CREATE INDEX order_lookup_attempts_order_idx ON public.order_lookup_attempts (order_number, created_at);