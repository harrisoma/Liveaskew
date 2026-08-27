
-- Bee conversations
CREATE TABLE public.bee_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bee_conversations TO authenticated;
GRANT ALL ON public.bee_conversations TO service_role;
ALTER TABLE public.bee_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own conversations" ON public.bee_conversations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_bee_conversations_updated_at BEFORE UPDATE ON public.bee_conversations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX idx_bee_conversations_user ON public.bee_conversations(user_id, updated_at DESC);

-- Bee messages
CREATE TABLE public.bee_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.bee_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bee_messages TO authenticated;
GRANT ALL ON public.bee_messages TO service_role;
ALTER TABLE public.bee_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own messages" ON public.bee_messages
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_bee_messages_conv ON public.bee_messages(conversation_id, created_at ASC);

-- Subscribers (payment-state mirror)
CREATE TABLE public.subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text NOT NULL,
  stripe_customer_id text,
  stripe_subscription_id text,
  tier text,
  status text NOT NULL DEFAULT 'inactive',
  current_period_end timestamptz,
  trial_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscribers TO authenticated;
GRANT ALL ON public.subscribers TO service_role;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own subscription" ON public.subscribers
  FOR SELECT USING (auth.uid() = user_id);
CREATE TRIGGER trg_subscribers_updated_at BEFORE UPDATE ON public.subscribers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
