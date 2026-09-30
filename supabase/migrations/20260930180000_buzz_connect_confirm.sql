-- Buzz connect is confirmed by the member's own signed-in app before an account is attached.
-- The callback parks the network's tokens here (sealed), keyed by the hash of a one-time
-- token that only the browser completing the sign-in receives. Service-role only.

CREATE TABLE IF NOT EXISTS public.social_oauth_pending (
  finish_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  network text NOT NULL,
  accounts_enc text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.social_oauth_pending ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.social_oauth_pending FROM anon, authenticated;
GRANT ALL ON public.social_oauth_pending TO service_role;
