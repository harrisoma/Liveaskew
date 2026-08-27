
CREATE TABLE public.style_plate_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  model TEXT,
  prompt TEXT,
  status TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 1,
  duration_ms INTEGER,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX style_plate_generations_user_id_idx ON public.style_plate_generations(user_id, created_at DESC);

GRANT SELECT ON public.style_plate_generations TO authenticated;
GRANT ALL ON public.style_plate_generations TO service_role;

ALTER TABLE public.style_plate_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own plate generation logs"
  ON public.style_plate_generations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
