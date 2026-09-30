-- The Hive trigger functions run only as triggers; keep them off the public RPC API.
-- Revoking EXECUTE does not stop the triggers from firing.
REVOKE EXECUTE ON FUNCTION public.hive_stamp_author() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.hive_hide_reported() FROM PUBLIC, anon, authenticated;
