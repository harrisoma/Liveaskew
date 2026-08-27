
CREATE TABLE public.bee_onboarding_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  pillar TEXT NOT NULL CHECK (pillar IN ('fit','feel','fabric','meta')),
  choice TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, question_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bee_onboarding_responses TO authenticated;
GRANT ALL ON public.bee_onboarding_responses TO service_role;
ALTER TABLE public.bee_onboarding_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own bee responses" ON public.bee_onboarding_responses
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER bee_onboarding_responses_touch
  BEFORE UPDATE ON public.bee_onboarding_responses
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
