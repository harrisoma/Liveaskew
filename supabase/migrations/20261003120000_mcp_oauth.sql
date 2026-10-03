-- LiveAskew as an MCP connector (Claude, ChatGPT, Cursor, …).
-- Assistants register as OAuth clients, a member approves them once, and they receive
-- short-lived access tokens tied to her account. Codes and tokens are stored only as
-- SHA-256 hashes. Service-role only: the app never reads these tables directly.

CREATE TABLE IF NOT EXISTS public.mcp_clients (
  id text PRIMARY KEY,
  name text NOT NULL DEFAULT '' CHECK (char_length(name) <= 120),
  redirect_uris text[] NOT NULL CHECK (cardinality(redirect_uris) BETWEEN 1 AND 10),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mcp_codes (
  code_hash text PRIMARY KEY,
  client_id text NOT NULL REFERENCES public.mcp_clients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  redirect_uri text NOT NULL,
  code_challenge text NOT NULL,
  scope text NOT NULL DEFAULT 'liveaskew',
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mcp_tokens (
  token_hash text PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('access', 'refresh')),
  client_id text NOT NULL REFERENCES public.mcp_clients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scope text NOT NULL DEFAULT 'liveaskew',
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mcp_tokens_user_idx ON public.mcp_tokens (user_id);

ALTER TABLE public.mcp_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcp_tokens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mcp_clients, public.mcp_codes, public.mcp_tokens FROM anon, authenticated;
GRANT ALL ON public.mcp_clients, public.mcp_codes, public.mcp_tokens TO service_role;
