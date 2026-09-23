-- Trial, verification, wardrobe reset, and virtual try-on cache.
-- RLS on every exposed table.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS auth_provider text,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz;

ALTER TABLE public.wardrobe_items
  ADD COLUMN IF NOT EXISTS reset_verdict text,
  ADD COLUMN IF NOT EXISTS reset_reason text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wardrobe_items_reset_verdict_check'
  ) THEN
    ALTER TABLE public.wardrobe_items
      ADD CONSTRAINT wardrobe_items_reset_verdict_check
      CHECK (reset_verdict IS NULL OR reset_verdict IN ('keep', 'toss', 'maybe'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('email', 'sms')),
  destination text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.tryon_renders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  look_id text NOT NULL,
  cache_key text NOT NULL UNIQUE,
  image_path text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tryon_renders ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.verification_codes TO service_role;
GRANT ALL ON public.tryon_renders TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.tryon_renders TO authenticated;

CREATE POLICY "Users read own try-ons"
  ON public.tryon_renders FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own try-ons"
  ON public.tryon_renders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own try-ons"
  ON public.tryon_renders FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

INSERT INTO storage.buckets (id, name, public)
VALUES ('try-ons', 'try-ons', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users read own try-on files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'try-ons' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own try-on files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'try-ons' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own try-on files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'try-ons' AND auth.uid()::text = (storage.foldername(name))[1]);
