CREATE TABLE public.user_look_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.family_profiles(id) ON DELETE SET NULL,
  look_id uuid REFERENCES public.looks(id) ON DELETE SET NULL,
  image_url text,
  status text NOT NULL CHECK (status IN ('approved','rejected')),
  style_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, profile_id, look_id, status)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_look_feedback TO authenticated;
GRANT ALL ON public.user_look_feedback TO service_role;

ALTER TABLE public.user_look_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own look feedback"
  ON public.user_look_feedback
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX user_look_feedback_user_status_idx
  ON public.user_look_feedback (user_id, status, created_at DESC);

CREATE TRIGGER user_look_feedback_touch_updated_at
  BEFORE UPDATE ON public.user_look_feedback
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();