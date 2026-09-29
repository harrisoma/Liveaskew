-- Buzz: connected social accounts and scheduled publishing.
-- Tokens are encrypted by the app (BUZZ_TOKEN_KEY) and these tables are service-role only:
-- the app reads them through /api/buzz/* and never ships a token to a device.

CREATE TABLE IF NOT EXISTS public.social_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  network text NOT NULL CHECK (network IN ('instagram', 'facebook', 'linkedin', 'x', 'threads')),
  account_id text NOT NULL,
  account_name text NOT NULL DEFAULT '',
  access_token_enc text NOT NULL,
  refresh_token_enc text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, network)
);

CREATE TABLE IF NOT EXISTS public.social_oauth_states (
  state text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  network text NOT NULL,
  code_verifier text,
  return_to text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_oauth_states ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.social_connections, public.social_oauth_states FROM anon, authenticated;
GRANT ALL ON public.social_connections, public.social_oauth_states TO service_role;

-- Posts on the Honey calendar carry what Buzz needs to publish them.
ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS media_url text,
  ADD COLUMN IF NOT EXISTS post_error text,
  ADD COLUMN IF NOT EXISTS post_url text,
  ADD COLUMN IF NOT EXISTS posted_at timestamptz;

ALTER TABLE public.calendar_events DROP CONSTRAINT IF EXISTS calendar_events_post_status_check;
ALTER TABLE public.calendar_events
  ADD CONSTRAINT calendar_events_post_status_check
  CHECK (post_status IS NULL OR post_status IN ('scheduled', 'publishing', 'posted', 'failed'));

CREATE INDEX IF NOT EXISTS calendar_events_due_posts_idx
  ON public.calendar_events (scheduled_at)
  WHERE kind = 'post' AND post_status = 'scheduled';

-- Images for posts. Public read (networks fetch them by URL); members write only their own folder.
INSERT INTO storage.buckets (id, name, public)
VALUES ('buzz-media', 'buzz-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Members upload own Buzz media" ON storage.objects;
CREATE POLICY "Members upload own Buzz media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'buzz-media' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Members delete own Buzz media" ON storage.objects;
CREATE POLICY "Members delete own Buzz media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'buzz-media' AND auth.uid()::text = (storage.foldername(name))[1]);
