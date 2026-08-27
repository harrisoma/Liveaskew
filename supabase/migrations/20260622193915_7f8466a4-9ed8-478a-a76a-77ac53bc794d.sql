-- Revoke executable access on SECURITY DEFINER functions that should not be callable via the Data API
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_family_profile_limit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;

-- Functions that must remain callable by signed-in users, but not anonymous callers
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.rotate_style_guide_share_token() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.revoke_style_guide_share_token() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rotate_style_guide_share_token() TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_style_guide_share_token() TO authenticated;

-- Tighten the public storage bucket: drop the unrestricted list policy.
-- The bucket stays public so direct file URLs continue to work; only listing the bucket via the API is restricted.
DROP POLICY IF EXISTS "Anyone can view style illustrations" ON storage.objects;
