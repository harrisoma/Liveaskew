-- Server-side guard for AI features: one row per call, counted per user per hour.
-- Service-role only; the app never reads it.

CREATE TABLE IF NOT EXISTS public.ai_calls (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_calls_user_feature_time_idx
  ON public.ai_calls (user_id, feature, created_at DESC);

ALTER TABLE public.ai_calls ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_calls FROM anon, authenticated;
GRANT ALL ON public.ai_calls TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.ai_calls_id_seq TO service_role;
