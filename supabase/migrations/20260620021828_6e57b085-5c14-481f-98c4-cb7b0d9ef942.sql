
ALTER TABLE public.style_profiles
  ADD COLUMN IF NOT EXISTS illustrations jsonb;

-- Storage RLS: users read/write only their own folder in style-illustrations.
-- Bucket is public so generated images render via getPublicUrl without signing.
CREATE POLICY "Users read own style illustrations"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'style-illustrations' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users write own style illustrations"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'style-illustrations' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own style illustrations"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'style-illustrations' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own style illustrations"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'style-illustrations' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view style illustrations"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'style-illustrations');
