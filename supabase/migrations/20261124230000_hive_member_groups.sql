-- Hive is the parent member network. Member groups live inside it.
ALTER TABLE public.hive_rooms ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.hive_rooms ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','private'));
CREATE TABLE public.hive_group_members (
 room_id text NOT NULL REFERENCES public.hive_rooms(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 joined_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(room_id,user_id)
);
CREATE INDEX hive_group_members_user_idx ON public.hive_group_members(user_id,room_id);
CREATE TABLE public.hive_group_invites (
 token uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 room_id text NOT NULL REFERENCES public.hive_rooms(id) ON DELETE CASCADE,
 created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 expires_at timestamptz NOT NULL DEFAULT now()+interval '7 days',
 accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 accepted_at timestamptz
);
ALTER TABLE public.hive_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hive_group_invites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.hive_group_members,public.hive_group_invites FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.hive_group_members TO authenticated;
GRANT ALL ON public.hive_group_members,public.hive_group_invites TO service_role;
CREATE FUNCTION public.hive_can_access_room(p_room text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.hive_rooms r WHERE r.id=p_room AND
 (r.visibility='public' OR r.owner_id=auth.uid() OR EXISTS(SELECT 1 FROM public.hive_group_members m WHERE m.room_id=r.id AND m.user_id=auth.uid())))
$$;
CREATE FUNCTION public.hive_can_post_room(p_room text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT public.hive_can_access_room(p_room) AND EXISTS(SELECT 1 FROM public.hive_rooms r WHERE r.id=p_room AND
 (r.owner_id IS NULL OR r.owner_id=auth.uid() OR EXISTS(SELECT 1 FROM public.hive_group_members m WHERE m.room_id=r.id AND m.user_id=auth.uid())))
$$;
REVOKE ALL ON FUNCTION public.hive_can_access_room(text),public.hive_can_post_room(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.hive_can_access_room(text),public.hive_can_post_room(text) TO authenticated,service_role;
DROP POLICY "Members read rooms" ON public.hive_rooms;
CREATE POLICY "Members read accessible rooms" ON public.hive_rooms FOR SELECT TO authenticated USING(public.hive_can_access_room(id));
CREATE POLICY "Members read own group memberships" ON public.hive_group_members FOR SELECT TO authenticated USING(user_id=auth.uid());
DROP POLICY "Members read visible messages" ON public.hive_messages;
CREATE POLICY "Members read visible messages" ON public.hive_messages FOR SELECT TO authenticated USING(
 public.hive_can_access_room(room_id) AND (NOT hidden OR auth.uid()=user_id) AND NOT EXISTS(SELECT 1 FROM public.hive_blocks b WHERE b.blocker_id=auth.uid() AND b.blocked_id=hive_messages.user_id));
DROP POLICY "Members post as themselves" ON public.hive_messages;
CREATE POLICY "Members post as themselves" ON public.hive_messages FOR INSERT TO authenticated WITH CHECK(auth.uid()=user_id AND public.hive_can_post_room(room_id));
DROP POLICY "Members report as themselves" ON public.hive_reports;
CREATE POLICY "Members report as themselves" ON public.hive_reports FOR INSERT TO authenticated WITH CHECK(auth.uid()=reporter_id AND EXISTS(SELECT 1 FROM public.hive_messages m WHERE m.id=message_id));
INSERT INTO public.hive_rooms(id,name,kind,blurb,sort_order) VALUES('main','Main network','topic','The place for everyone in the Hive. Start a conversation about anything on your mind.',0) ON CONFLICT(id) DO NOTHING;
CREATE FUNCTION public.hive_create_group(p_name text,p_description text,p_private boolean) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_id text := gen_random_uuid()::text; v_user uuid := auth.uid();
BEGIN
 IF v_user IS NULL OR NOT EXISTS(SELECT 1 FROM public.hive_profiles WHERE user_id=v_user) THEN RAISE EXCEPTION 'hive_profile_required'; END IF;
 IF EXISTS(SELECT 1 FROM public.hive_bans WHERE user_id=v_user) THEN RAISE EXCEPTION 'hive_banned'; END IF;
 IF length(trim(p_name)) NOT BETWEEN 2 AND 60 OR length(coalesce(p_description,''))>240 THEN RAISE EXCEPTION 'invalid_group'; END IF;
 IF (SELECT count(*) FROM public.hive_rooms WHERE owner_id=v_user)>=20 THEN RAISE EXCEPTION 'group_limit'; END IF;
 INSERT INTO public.hive_rooms(id,name,kind,blurb,owner_id,visibility) VALUES(v_id,trim(p_name),'group',trim(coalesce(p_description,'')),v_user,CASE WHEN p_private THEN 'private' ELSE 'public' END);
 INSERT INTO public.hive_group_members(room_id,user_id) VALUES(v_id,v_user);
 RETURN v_id;
END $$;
CREATE FUNCTION public.hive_join_group(p_room text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.hive_profiles WHERE user_id=auth.uid()) THEN RAISE EXCEPTION 'hive_profile_required'; END IF;
 IF EXISTS(SELECT 1 FROM public.hive_bans WHERE user_id=auth.uid()) THEN RAISE EXCEPTION 'hive_banned'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.hive_rooms WHERE id=p_room AND owner_id IS NOT NULL AND visibility='public') THEN RAISE EXCEPTION 'group_not_available'; END IF;
 INSERT INTO public.hive_group_members(room_id,user_id) VALUES(p_room,auth.uid()) ON CONFLICT DO NOTHING;
END $$;
CREATE FUNCTION public.hive_leave_group(p_room text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
 IF EXISTS(SELECT 1 FROM public.hive_rooms WHERE id=p_room AND owner_id=auth.uid()) THEN RAISE EXCEPTION 'owner_cannot_leave'; END IF;
 DELETE FROM public.hive_group_members WHERE room_id=p_room AND user_id=auth.uid();
END $$;
CREATE FUNCTION public.hive_invite_group(p_room text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_token uuid;
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.hive_rooms WHERE id=p_room AND owner_id=auth.uid()) THEN RAISE EXCEPTION 'owner_required'; END IF;
 IF EXISTS(SELECT 1 FROM public.hive_bans WHERE user_id=auth.uid()) THEN RAISE EXCEPTION 'hive_banned'; END IF;
 IF (SELECT count(*) FROM public.hive_group_invites WHERE created_by=auth.uid() AND accepted_at IS NULL AND expires_at>now())>=50 THEN RAISE EXCEPTION 'invite_limit'; END IF;
 INSERT INTO public.hive_group_invites(room_id,created_by) VALUES(p_room,auth.uid()) RETURNING token INTO v_token; RETURN v_token;
END $$;
CREATE FUNCTION public.hive_accept_invite(p_token uuid) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_inv public.hive_group_invites;
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.hive_profiles WHERE user_id=auth.uid()) THEN RAISE EXCEPTION 'hive_profile_required'; END IF;
 IF EXISTS(SELECT 1 FROM public.hive_bans WHERE user_id=auth.uid()) THEN RAISE EXCEPTION 'hive_banned'; END IF;
 SELECT * INTO v_inv FROM public.hive_group_invites WHERE token=p_token AND expires_at>now() AND accepted_at IS NULL FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'invite_unavailable'; END IF;
 IF EXISTS(SELECT 1 FROM public.hive_blocks WHERE (blocker_id=auth.uid() AND blocked_id=v_inv.created_by) OR (blocked_id=auth.uid() AND blocker_id=v_inv.created_by)) THEN RAISE EXCEPTION 'invite_unavailable'; END IF;
 INSERT INTO public.hive_group_members(room_id,user_id) VALUES(v_inv.room_id,auth.uid()) ON CONFLICT DO NOTHING;
 UPDATE public.hive_group_invites SET accepted_at=now(),accepted_by=auth.uid() WHERE token=p_token; RETURN v_inv.room_id;
END $$;
REVOKE ALL ON FUNCTION public.hive_create_group(text,text,boolean),public.hive_join_group(text),public.hive_leave_group(text),public.hive_invite_group(text),public.hive_accept_invite(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.hive_create_group(text,text,boolean),public.hive_join_group(text),public.hive_leave_group(text),public.hive_invite_group(text),public.hive_accept_invite(uuid) TO authenticated;
