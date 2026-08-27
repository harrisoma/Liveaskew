
CREATE POLICY "Users read own selfies"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'selfies' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users upload own selfies"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'selfies' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users update own selfies"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'selfies' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'selfies' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own selfies"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'selfies' AND (storage.foldername(name))[1] = auth.uid()::text);
