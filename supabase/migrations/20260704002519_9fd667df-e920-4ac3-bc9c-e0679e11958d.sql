ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dashboard_theme text NOT NULL DEFAULT 'default';
ALTER TABLE public.profiles ADD CONSTRAINT profiles_dashboard_theme_check CHECK (dashboard_theme IN ('default','revealed'));
UPDATE public.profiles SET dashboard_theme = 'default' WHERE dashboard_theme IS NULL;