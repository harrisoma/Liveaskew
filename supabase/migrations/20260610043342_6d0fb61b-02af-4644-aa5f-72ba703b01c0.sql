
-- shared updated_at trigger (reuse touch_updated_at if present)
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  email text,
  size_top text,
  size_bottom text,
  size_shoe text,
  size_bra text,
  height_cm integer,
  body_shape text,
  location text,
  climate text,
  budget_band text,
  preferred_currency text DEFAULT 'USD',
  time_zone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile" ON public.profiles
  FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- style_profiles
CREATE TABLE public.style_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  color_palette jsonb,
  color_season text,
  pillar_weights jsonb,
  lifestyle_mix jsonb,
  north_star text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.style_profiles TO authenticated;
GRANT ALL ON public.style_profiles TO service_role;
ALTER TABLE public.style_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own style profile" ON public.style_profiles
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER style_profiles_touch BEFORE UPDATE ON public.style_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- wardrobe_items
CREATE TABLE public.wardrobe_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  subcategory text,
  name text,
  brand text,
  color text,
  pattern text,
  season text,
  photo_path text,
  notes text,
  tags text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wardrobe_items TO authenticated;
GRANT ALL ON public.wardrobe_items TO service_role;
ALTER TABLE public.wardrobe_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own wardrobe" ON public.wardrobe_items
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX wardrobe_items_user_idx ON public.wardrobe_items(user_id);
CREATE TRIGGER wardrobe_items_touch BEFORE UPDATE ON public.wardrobe_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- looks
CREATE TABLE public.looks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  occasion text,
  season text,
  notes text,
  cover_photo_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.looks TO authenticated;
GRANT ALL ON public.looks TO service_role;
ALTER TABLE public.looks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own looks" ON public.looks
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX looks_user_idx ON public.looks(user_id);
CREATE TRIGGER looks_touch BEFORE UPDATE ON public.looks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- look_items (join)
CREATE TABLE public.look_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  look_id uuid NOT NULL REFERENCES public.looks(id) ON DELETE CASCADE,
  wardrobe_item_id uuid NOT NULL REFERENCES public.wardrobe_items(id) ON DELETE CASCADE,
  position integer DEFAULT 0,
  role text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (look_id, wardrobe_item_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.look_items TO authenticated;
GRANT ALL ON public.look_items TO service_role;
ALTER TABLE public.look_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own look items" ON public.look_items
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX look_items_look_idx ON public.look_items(look_id);

-- Storage policies for wardrobe-photos (bucket created via storage tool)
CREATE POLICY "Users read own wardrobe photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'wardrobe-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users upload own wardrobe photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'wardrobe-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own wardrobe photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'wardrobe-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own wardrobe photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'wardrobe-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
