ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS selfie_photo_path text;
ALTER TABLE public.family_profiles ADD COLUMN IF NOT EXISTS selfie_photo_path text;