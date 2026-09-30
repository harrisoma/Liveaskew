-- Follow the member across devices: interview answers and looks.
-- The styling photo is deliberately NOT synced; it stays on the device.

CREATE TABLE IF NOT EXISTS public.member_style (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  interview jsonb NOT NULL DEFAULT '{}'::jsonb,
  onboarding jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.member_looks (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id text NOT NULL CHECK (char_length(id) BETWEEN 1 AND 120),
  look jsonb NOT NULL,
  saved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id),
  CHECK (pg_column_size(look) < 16384)
);

ALTER TABLE public.member_style ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_looks ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_style, public.member_looks TO authenticated;
GRANT ALL ON public.member_style, public.member_looks TO service_role;

DROP POLICY IF EXISTS "Members own their style" ON public.member_style;
CREATE POLICY "Members own their style"
  ON public.member_style FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Members own their looks" ON public.member_looks;
CREATE POLICY "Members own their looks"
  ON public.member_looks FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
