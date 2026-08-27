
CREATE TABLE public.family_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL CHECK (relationship IN ('husband','wife','partner','child')),
  sizes JSONB NOT NULL DEFAULT '{}'::jsonb,
  aesthetic_territory TEXT,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_profiles TO authenticated;
GRANT ALL ON public.family_profiles TO service_role;

ALTER TABLE public.family_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their family profiles"
  ON public.family_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER family_profiles_touch_updated_at
  BEFORE UPDATE ON public.family_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Enforce max 3 sub-profiles per primary member
CREATE OR REPLACE FUNCTION public.enforce_family_profile_limit()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.family_profiles WHERE user_id = NEW.user_id) >= 3 THEN
    RAISE EXCEPTION 'Platinum Plus households allow up to 3 family profiles.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER family_profiles_limit
  BEFORE INSERT ON public.family_profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_family_profile_limit();
