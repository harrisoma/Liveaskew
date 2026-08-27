
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS client_code text UNIQUE;

CREATE SEQUENCE IF NOT EXISTS public.client_code_seq START 1;

CREATE OR REPLACE FUNCTION public.assign_client_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.client_code IS NULL THEN
    NEW.client_code := 'LA-' || lpad(nextval('public.client_code_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.assign_client_code() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS assign_client_code_trigger ON public.profiles;
CREATE TRIGGER assign_client_code_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_client_code();

-- Backfill existing profiles ordered by created_at
WITH ordered AS (
  SELECT id, row_number() OVER (ORDER BY created_at) AS rn
  FROM public.profiles
  WHERE client_code IS NULL
)
UPDATE public.profiles p
SET client_code = 'LA-' || lpad((ordered.rn + COALESCE((SELECT last_value FROM public.client_code_seq WHERE is_called), 0))::text, 4, '0')
FROM ordered
WHERE p.id = ordered.id;

-- Advance sequence past backfilled values
SELECT setval('public.client_code_seq', GREATEST(
  (SELECT COUNT(*) FROM public.profiles WHERE client_code IS NOT NULL),
  1
));
