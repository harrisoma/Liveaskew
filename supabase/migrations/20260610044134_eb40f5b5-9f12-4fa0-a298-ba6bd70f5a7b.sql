
-- Storage policies for look-images (owner-only, folder = user id)
CREATE POLICY "Users read own look images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'look-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users upload own look images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'look-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own look images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'look-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own look images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'look-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow AI-recommended items in look_items (no wardrobe row required)
ALTER TABLE public.look_items
  ALTER COLUMN wardrobe_item_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS color text,
  ADD COLUMN IF NOT EXISTS recommended_fit text;

ALTER TABLE public.look_items
  DROP CONSTRAINT IF EXISTS look_items_source_check;
ALTER TABLE public.look_items
  ADD CONSTRAINT look_items_source_check
  CHECK (wardrobe_item_id IS NOT NULL OR category IS NOT NULL);

-- The (look_id, wardrobe_item_id) unique constraint blocks multiple
-- recommendations on the same look (both nulls collide on some PG paths).
-- Replace with a partial unique only when wardrobe_item_id is set.
ALTER TABLE public.look_items
  DROP CONSTRAINT IF EXISTS look_items_look_id_wardrobe_item_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS look_items_look_wardrobe_unique
  ON public.look_items(look_id, wardrobe_item_id)
  WHERE wardrobe_item_id IS NOT NULL;
