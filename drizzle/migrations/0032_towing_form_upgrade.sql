ALTER TABLE public.towing_requests
  ADD COLUMN IF NOT EXISTS rider_type text NOT NULL DEFAULT 'thai' CHECK (rider_type IN ('thai','foreign')),
  ADD COLUMN IF NOT EXISTS nationality text CHECK (char_length(nationality) <= 60),
  ADD COLUMN IF NOT EXISTS passport_number text CHECK (char_length(passport_number) <= 20),
  ADD COLUMN IF NOT EXISTS urgency text NOT NULL DEFAULT 'not_urgent' CHECK (urgency IN ('urgent','not_urgent')),
  ADD COLUMN IF NOT EXISTS rider_transport text NOT NULL DEFAULT 'with_pickup' CHECK (rider_transport IN ('with_pickup','own_transport')),
  ADD COLUMN IF NOT EXISTS pickup_region text,
  ADD COLUMN IF NOT EXISTS pickup_town text,
  ADD COLUMN IF NOT EXISTS maps_link text CHECK (char_length(maps_link) <= 500),
  ADD COLUMN IF NOT EXISTS destination_region text,
  ADD COLUMN IF NOT EXISTS destination_town text,
  ADD COLUMN IF NOT EXISTS photo_paths text[] NOT NULL DEFAULT '{}' CHECK (cardinality(photo_paths) <= 5),
  ADD COLUMN IF NOT EXISTS phone_digits text;
CREATE INDEX IF NOT EXISTS towing_requests_phone_recent ON public.towing_requests (phone_digits, created_at);
CREATE INDEX IF NOT EXISTS towing_requests_created ON public.towing_requests (created_at);