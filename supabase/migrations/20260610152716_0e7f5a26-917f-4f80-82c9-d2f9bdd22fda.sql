
CREATE OR REPLACE FUNCTION public.enforce_family_profile_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.family_profiles WHERE user_id = NEW.user_id) >= 3 THEN
    RAISE EXCEPTION 'Platinum Plus households allow up to 3 family profiles.';
  END IF;
  RETURN NEW;
END;
$$;
