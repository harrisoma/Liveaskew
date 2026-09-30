-- Honey: one calendar for events, meetings, and Buzz social posts.
-- Extends calendar_events (already RLS-scoped to the owner) instead of a new table,
-- so Bee's per-event outfit recommendation keeps working.

ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS start_time time,
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'event',
  ADD COLUMN IF NOT EXISTS network text,
  ADD COLUMN IF NOT EXISTS look_id text,
  ADD COLUMN IF NOT EXISTS caption text,
  ADD COLUMN IF NOT EXISTS post_status text,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS client_id text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'calendar_events_kind_check') THEN
    ALTER TABLE public.calendar_events
      ADD CONSTRAINT calendar_events_kind_check CHECK (kind IN ('event', 'meeting', 'post'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'calendar_events_post_status_check') THEN
    ALTER TABLE public.calendar_events
      ADD CONSTRAINT calendar_events_post_status_check
      CHECK (post_status IS NULL OR post_status IN ('scheduled', 'posted', 'failed'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'calendar_events_source_check') THEN
    ALTER TABLE public.calendar_events
      ADD CONSTRAINT calendar_events_source_check
      CHECK (source IN ('manual', 'google', 'apple', 'outlook'));
  END IF;
END $$;

-- The app and calendar sync upsert on (user_id, client_id). Not partial: PostgREST's
-- on_conflict cannot target a partial index. NULL client ids (older rows) stay distinct.
CREATE UNIQUE INDEX IF NOT EXISTS calendar_events_client_idx
  ON public.calendar_events (user_id, client_id);

CREATE INDEX IF NOT EXISTS calendar_events_user_date_idx
  ON public.calendar_events (user_id, event_date);
