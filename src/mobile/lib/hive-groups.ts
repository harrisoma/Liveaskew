import { inviteToken } from "./hive-invites";
import type { HiveRoom, HiveMessage } from "./hive";
import { listMessages, sendMessage } from "./hive";
export type HiveGroup = HiveRoom & {
  ownerId: string | null;
  visibility: "public" | "private";
  joined: boolean;
};
export type HiveCommunityApi = {
  list: () => Promise<HiveGroup[]>;
  feed: () => Promise<HiveMessage[]>;
  post: (body: string) => Promise<HiveMessage>;
  create: (name: string, description: string, isPrivate: boolean) => Promise<string>;
  join: (id: string) => Promise<void>;
  leave: (id: string) => Promise<void>;
  invite: (id: string) => Promise<string>;
  accept: (token: string) => Promise<string>;
};

async function groupClient() {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error("Sign in to use the Hive.");
  const { createClient } = await import("@supabase/supabase-js");
  // Separate schema boundary for this pending migration. Reuse the member session; never service role.
  return createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    {
      global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    },
  );
}
async function rpc(name: string, args: Record<string, unknown>) {
  const db = await groupClient();
  const { data, error } = await db.rpc(name, args);
  if (error)
    throw new Error(
      error.message.includes("invite_unavailable")
        ? "This invitation has expired or already been used."
        : error.message.includes("owner_required")
          ? "Only the group owner can invite members."
          : error.message.includes("hive_banned")
            ? "Your community posting access is paused."
            : "This action couldn’t complete. Please try again.",
    );
  return data;
}
export function communityApi(userId: string): HiveCommunityApi {
  return {
    async list() {
      const db = await groupClient();
      const [{ data: rooms, error }, { data: members, error: memberError }] = await Promise.all([
        db.from("hive_rooms").select("id,name,kind,blurb,owner_id,visibility").order("sort_order"),
        db.from("hive_group_members").select("room_id").eq("user_id", userId),
      ]);
      if (error || memberError)
        throw new Error(
          "Group features aren’t available yet. Your existing Hive rooms are unchanged.",
        );
      const joined = new Set((members ?? []).map((m) => m.room_id));
      return (rooms ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        kind: r.kind,
        blurb: r.blurb,
        ownerId: r.owner_id,
        visibility: r.visibility,
        joined: joined.has(r.id) || !r.owner_id,
      }));
    },
    feed: () => listMessages("main"),
    async post(body) {
      const result = await sendMessage({ roomId: "main", userId, body });
      if ("error" in result) throw new Error(result.error);
      return result;
    },
    async create(name, description, isPrivate) {
      return String(
        await rpc("hive_create_group", {
          p_name: name,
          p_description: description,
          p_private: isPrivate,
        }),
      );
    },
    async join(id) {
      await rpc("hive_join_group", { p_room: id });
    },
    async leave(id) {
      await rpc("hive_leave_group", { p_room: id });
    },
    async invite(id) {
      return String(await rpc("hive_invite_group", { p_room: id }));
    },
    async accept(value) {
      const token = inviteToken(value);
      if (!token) throw new Error("Paste a valid Hive invitation link or code.");
      return String(await rpc("hive_accept_invite", { p_token: token }));
    },
  };
}
