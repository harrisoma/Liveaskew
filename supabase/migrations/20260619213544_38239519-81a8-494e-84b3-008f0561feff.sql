ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS share_token uuid UNIQUE;
CREATE INDEX IF NOT EXISTS profiles_share_token_idx ON public.profiles(share_token);

CREATE OR REPLACE FUNCTION public.rotate_style_guide_share_token()
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_token uuid := gen_random_uuid();
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE public.profiles SET share_token = new_token WHERE id = auth.uid();
  RETURN new_token;
END; $$;

CREATE OR REPLACE FUNCTION public.revoke_style_guide_share_token()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE public.profiles SET share_token = NULL WHERE id = auth.uid();
END; $$;

GRANT EXECUTE ON FUNCTION public.rotate_style_guide_share_token() TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_style_guide_share_token() TO authenticated;