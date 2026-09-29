-- Hive moderation: admins (user_roles.role = 'admin') review reported messages from the app.
-- Keep → reports cleared, message visible again. Remove → message deleted.
-- Ban → message deleted and the author can no longer post in the Hive.

ALTER TABLE public.hive_messages ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

CREATE TABLE IF NOT EXISTS public.hive_bans (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hive_bans ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.hive_bans FROM anon, authenticated;
GRANT ALL ON public.hive_bans TO service_role;

-- Same author stamp as before, plus: banned members cannot post; members cannot set reviewed_at.
CREATE OR REPLACE FUNCTION public.hive_stamp_author()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  name text;
BEGIN
  IF EXISTS (SELECT 1 FROM public.hive_bans WHERE user_id = NEW.user_id) THEN
    RAISE EXCEPTION 'hive_banned';
  END IF;
  SELECT display_name INTO name FROM public.hive_profiles WHERE user_id = NEW.user_id;
  IF name IS NULL THEN
    RAISE EXCEPTION 'hive_profile_required';
  END IF;
  NEW.author_name := name;
  NEW.hidden := false;
  NEW.reviewed_at := NULL;
  NEW.created_at := now();
  RETURN NEW;
END;
$$;

-- A message a moderator kept is not hidden again by the same old reports; new ones count afresh.
CREATE OR REPLACE FUNCTION public.hive_hide_reported()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  since timestamptz;
BEGIN
  SELECT reviewed_at INTO since FROM public.hive_messages WHERE id = NEW.message_id;
  IF (
    SELECT count(*) FROM public.hive_reports
    WHERE message_id = NEW.message_id AND (since IS NULL OR created_at > since)
  ) >= 3 THEN
    UPDATE public.hive_messages SET hidden = true WHERE id = NEW.message_id;
  END IF;
  RETURN NEW;
END;
$$;
