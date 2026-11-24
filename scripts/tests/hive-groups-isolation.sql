\set ON_ERROR_STOP on
INSERT INTO public.hive_profiles(user_id,display_name) SELECT id,'Member' FROM auth.users;
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
SELECT public.hive_create_group('Private circle','Any topic',true) AS private_room \gset
SELECT public.hive_create_group('Public circle','Open discussion',false) AS public_room \gset
SELECT public.hive_invite_group(:'private_room') AS invitation \gset
SELECT set_config('test.private_room',:'private_room',false),set_config('test.public_room',:'public_room',false),set_config('test.invitation',:'invitation',false);
INSERT INTO public.hive_messages(room_id,user_id,body) VALUES(:'private_room',auth.uid(),'Private message');
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false);
DO $$BEGIN
 IF EXISTS(SELECT 1 FROM public.hive_rooms WHERE id=current_setting('test.private_room')) THEN RAISE EXCEPTION 'FAIL: outsider sees private group'; END IF;
 IF EXISTS(SELECT 1 FROM public.hive_messages WHERE room_id=current_setting('test.private_room')) THEN RAISE EXCEPTION 'FAIL: outsider sees private messages'; END IF;
 BEGIN INSERT INTO public.hive_messages(room_id,user_id,body) VALUES(current_setting('test.private_room'),auth.uid(),'Unauthorized'); RAISE EXCEPTION 'FAIL: outsider wrote to private group'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM public.hive_invite_group(current_setting('test.private_room')); RAISE EXCEPTION 'FAIL: outsider issued invitation'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'owner_required' THEN RAISE; END IF; END;
 BEGIN INSERT INTO public.hive_messages(room_id,user_id,body) VALUES(current_setting('test.public_room'),auth.uid(),'Not joined'); RAISE EXCEPTION 'FAIL: non-member wrote to public group'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT public.hive_join_group(:'public_room');
INSERT INTO public.hive_messages(room_id,user_id,body) VALUES(:'public_room',auth.uid(),'Joined publicly');
SELECT public.hive_accept_invite(:'invitation');
DO $$BEGIN
 IF (SELECT count(*) FROM public.hive_messages WHERE room_id=current_setting('test.private_room'))<>1 THEN RAISE EXCEPTION 'FAIL: invited member cannot read'; END IF;
END $$;
INSERT INTO public.hive_messages(room_id,user_id,body) VALUES(:'private_room',auth.uid(),'Invited member message');
SELECT public.hive_leave_group(:'private_room');
DO $$BEGIN IF EXISTS(SELECT 1 FROM public.hive_messages WHERE room_id=current_setting('test.private_room')) THEN RAISE EXCEPTION 'FAIL: leaving did not revoke access'; END IF; END $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',false);
DO $$BEGIN
 BEGIN PERFORM public.hive_accept_invite(current_setting('test.invitation')::uuid); RAISE EXCEPTION 'FAIL: invitation reused'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'invite_unavailable' THEN RAISE; END IF; END;
END $$;
INSERT INTO public.hive_messages(room_id,user_id,body) VALUES('main',auth.uid(),'Main network discussion');
RESET ROLE;
SELECT 'PASS: private access, posting, membership, owner-only invitations, one-use invitations, leave revocation, and main network' AS result;
