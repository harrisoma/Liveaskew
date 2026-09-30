-- The server's own record of when a member's 14-day trial began.
-- profiles.trial_started_at is member-editable (display only); this table is service-role only,
-- so the paywall and Stripe trial length cannot be moved by editing a profile.

CREATE TABLE IF NOT EXISTS public.member_trials (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.member_trials ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.member_trials FROM anon, authenticated;
GRANT ALL ON public.member_trials TO service_role;

-- Carry over trials that already started (never a future date).
INSERT INTO public.member_trials (user_id, started_at)
SELECT id, LEAST(trial_started_at, now())
FROM public.profiles
WHERE trial_started_at IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;
