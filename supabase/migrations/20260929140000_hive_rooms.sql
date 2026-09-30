-- The Hive: rooms where members talk through their looks.
-- Signed-in members read and post; authorship is stamped by the database, not the client.
-- Moderation: anyone can report a message (3 reports hide it) and block a member.

CREATE TABLE IF NOT EXISTS public.hive_rooms (
  id text PRIMARY KEY,
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'topic' CHECK (kind IN ('topic', 'group', 'challenge')),
  blurb text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.hive_rooms (id, name, kind, blurb, sort_order) VALUES
  ('style', 'Style', 'topic', 'Maternity to the boardroom, said out loud.', 10),
  ('motherhood', 'Motherhood', 'topic', 'The school run, the night feed, the version of you that stayed.', 20),
  ('working-mom', 'Working mom', 'topic', 'The school run and the meeting, in the same afternoon.', 30),
  ('family', 'Family', 'topic', 'The people at the table, and what the day is actually for.', 40),
  ('editorial', 'Editorial', 'topic', 'The image, the credit, the cut.', 50),
  ('challenge', 'Style challenge', 'challenge', 'Boardroom on a Wednesday. One sentence with the look.', 60)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.hive_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 2 AND 40),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hive_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id text NOT NULL REFERENCES public.hive_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text NOT NULL DEFAULT '',
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  look jsonb,
  hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hive_messages_room_created_idx
  ON public.hive_messages (room_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.hive_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.hive_messages(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL DEFAULT 'other' CHECK (reason IN ('harassment', 'spam', 'body_shaming', 'other')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, reporter_id)
);

CREATE TABLE IF NOT EXISTS public.hive_blocks (
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

-- Stamp the author from hive_profiles so nobody can post under another name.
CREATE OR REPLACE FUNCTION public.hive_stamp_author()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  name text;
BEGIN
  SELECT display_name INTO name FROM public.hive_profiles WHERE user_id = NEW.user_id;
  IF name IS NULL THEN
    RAISE EXCEPTION 'hive_profile_required';
  END IF;
  NEW.author_name := name;
  NEW.hidden := false;
  NEW.created_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS hive_messages_stamp_author ON public.hive_messages;
CREATE TRIGGER hive_messages_stamp_author
  BEFORE INSERT ON public.hive_messages
  FOR EACH ROW EXECUTE FUNCTION public.hive_stamp_author();

-- Three separate reports hide a message until the team reviews it.
CREATE OR REPLACE FUNCTION public.hive_hide_reported()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT count(*) FROM public.hive_reports WHERE message_id = NEW.message_id) >= 3 THEN
    UPDATE public.hive_messages SET hidden = true WHERE id = NEW.message_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS hive_reports_hide ON public.hive_reports;
CREATE TRIGGER hive_reports_hide
  AFTER INSERT ON public.hive_reports
  FOR EACH ROW EXECUTE FUNCTION public.hive_hide_reported();

ALTER TABLE public.hive_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hive_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hive_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hive_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hive_blocks ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.hive_rooms TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.hive_profiles TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.hive_messages TO authenticated;
GRANT INSERT ON public.hive_reports TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.hive_blocks TO authenticated;
GRANT ALL ON public.hive_rooms, public.hive_profiles, public.hive_messages,
  public.hive_reports, public.hive_blocks TO service_role;

DROP POLICY IF EXISTS "Members read rooms" ON public.hive_rooms;
CREATE POLICY "Members read rooms"
  ON public.hive_rooms FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Members read profiles" ON public.hive_profiles;
CREATE POLICY "Members read profiles"
  ON public.hive_profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Members create own profile" ON public.hive_profiles;
CREATE POLICY "Members create own profile"
  ON public.hive_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Members update own profile" ON public.hive_profiles;
CREATE POLICY "Members update own profile"
  ON public.hive_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Hidden messages stay visible to their author only; blocked members disappear for the blocker.
DROP POLICY IF EXISTS "Members read visible messages" ON public.hive_messages;
CREATE POLICY "Members read visible messages"
  ON public.hive_messages FOR SELECT TO authenticated
  USING (
    (NOT hidden OR auth.uid() = user_id)
    AND NOT EXISTS (
      SELECT 1 FROM public.hive_blocks b
      WHERE b.blocker_id = auth.uid() AND b.blocked_id = hive_messages.user_id
    )
  );
DROP POLICY IF EXISTS "Members post as themselves" ON public.hive_messages;
CREATE POLICY "Members post as themselves"
  ON public.hive_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Members delete own messages" ON public.hive_messages;
CREATE POLICY "Members delete own messages"
  ON public.hive_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Members report as themselves" ON public.hive_reports;
CREATE POLICY "Members report as themselves"
  ON public.hive_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Members read own blocks" ON public.hive_blocks;
CREATE POLICY "Members read own blocks"
  ON public.hive_blocks FOR SELECT TO authenticated USING (auth.uid() = blocker_id);
DROP POLICY IF EXISTS "Members block as themselves" ON public.hive_blocks;
CREATE POLICY "Members block as themselves"
  ON public.hive_blocks FOR INSERT TO authenticated WITH CHECK (auth.uid() = blocker_id);
DROP POLICY IF EXISTS "Members unblock as themselves" ON public.hive_blocks;
CREATE POLICY "Members unblock as themselves"
  ON public.hive_blocks FOR DELETE TO authenticated USING (auth.uid() = blocker_id);

-- Live rooms.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'hive_messages'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.hive_messages;
  END IF;
END $$;
