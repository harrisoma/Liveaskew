
-- 1. Track interview completion + pricing visit on the conversation
ALTER TABLE public.bee_conversations
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS pricing_visited_at timestamptz,
  ADD COLUMN IF NOT EXISTS pricing_abandoned_sent_at timestamptz;

-- 2. Track trial-ending email + dunning attempts
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS trial_ending_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS dunning_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dunning_last_sent_at timestamptz;

-- 3. Repeat-trial detection table
CREATE TABLE IF NOT EXISTS public.trial_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  environment text NOT NULL DEFAULT 'sandbox',
  stripe_subscription_id text,
  started_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS trial_history_user_env_idx
  ON public.trial_history (user_id, environment);
CREATE UNIQUE INDEX IF NOT EXISTS trial_history_email_env_idx
  ON public.trial_history (lower(email), environment);

GRANT SELECT ON public.trial_history TO authenticated;
GRANT ALL ON public.trial_history TO service_role;

ALTER TABLE public.trial_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trial history"
  ON public.trial_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
