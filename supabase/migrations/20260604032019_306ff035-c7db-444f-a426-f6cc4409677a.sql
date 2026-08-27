
CREATE TABLE public.personal_styling_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT,
  preferred_contact TEXT NOT NULL,
  best_time_to_call TEXT,
  what_she_needs TEXT NOT NULL,
  budget_range TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.personal_styling_inquiries TO anon;
GRANT INSERT ON public.personal_styling_inquiries TO authenticated;
GRANT ALL ON public.personal_styling_inquiries TO service_role;

ALTER TABLE public.personal_styling_inquiries ENABLE ROW LEVEL SECURITY;

-- Anyone (including unauthenticated visitors) may submit an inquiry.
CREATE POLICY "Anyone can submit an inquiry"
  ON public.personal_styling_inquiries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(full_name) BETWEEN 1 AND 200
    AND char_length(email) BETWEEN 3 AND 320
    AND char_length(phone) BETWEEN 3 AND 50
    AND char_length(what_she_needs) BETWEEN 1 AND 5000
  );

-- No SELECT/UPDATE/DELETE policies: inquiries are private to the founder
-- and only readable via the backend (service role) / Cloud dashboard.
