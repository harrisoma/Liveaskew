import NextAuth, { type DefaultSession } from "next-auth";
import Apple from "next-auth/providers/apple";
import Credentials from "next-auth/providers/credentials";
import Facebook from "next-auth/providers/facebook";
import Google from "next-auth/providers/google";
import type { Provider } from "next-auth/providers";
import { linkIdentity, PROVIDERS, type ProviderId } from "@liveaskew/auth";
import { readUsers, writeUsers } from "./lib/users";

declare module "next-auth" {
  interface Session {
    providers: string[];
    user: { id: string } & DefaultSession["user"];
  }

  interface User {
    providers?: string[];
  }
}

function oauth(
  name: string,
  factory: (args: { clientId: string; clientSecret: string }) => Provider,
) {
  const clientId = process.env[`AUTH_${name}_ID`];
  const clientSecret = process.env[`AUTH_${name}_SECRET`];
  if (!clientId || !clientSecret) return null;
  return factory({ clientId, clientSecret });
}

function social(
  id: ProviderId,
  name: string,
  authorization: string,
  token: string,
  userinfo: string,
) {
  const clientId = process.env[`AUTH_${id.toUpperCase()}_ID`];
  const clientSecret = process.env[`AUTH_${id.toUpperCase()}_SECRET`];
  if (!clientId || !clientSecret) return null;
  return {
    id,
    name,
    type: "oauth" as const,
    clientId,
    clientSecret,
    authorization,
    token,
    userinfo,
    profile(profile: {
      id?: string;
      username?: string;
      data?: { user?: { open_id?: string; display_name?: string } };
    }) {
      const tiktok = profile.data?.user;
      return {
        id: tiktok?.open_id ?? profile.id ?? id,
        name: tiktok?.display_name ?? profile.username ?? name,
        email: null,
      };
    },
  } satisfies Provider;
}

const providers = [
  oauth("GOOGLE", Google),
  oauth("APPLE", Apple),
  oauth("FACEBOOK", Facebook),
  social(
    "instagram",
    "Instagram",
    "https://api.instagram.com/oauth/authorize?scope=user_profile",
    "https://api.instagram.com/oauth/access_token",
    "https://graph.instagram.com/me?fields=id,username",
  ),
  social(
    "tiktok",
    "TikTok",
    "https://www.tiktok.com/v2/auth/authorize/",
    "https://open.tiktokapis.com/v2/oauth/token/",
    "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name",
  ),
].filter((provider) => provider !== null);

if (process.env.AUTH_DEV_LOGIN === "1") {
  providers.push(
    Credentials({
      id: "dev-link",
      name: "Link a platform",
      credentials: {
        provider: { label: "Platform" },
        email: { label: "Email" },
        name: { label: "Name" },
        providerAccountId: { label: "Account" },
      },
      authorize(credentials) {
        const provider = String(credentials?.provider ?? "");
        if (!PROVIDERS.includes(provider as ProviderId)) return null;
        const linked = linkIdentity(readUsers(), {
          provider: provider as ProviderId,
          providerAccountId: String(credentials?.providerAccountId ?? provider),
          email: String(credentials?.email ?? ""),
          name: String(credentials?.name ?? "Hive member"),
        });
        writeUsers(linked.users);
        return {
          id: linked.user.id,
          email: linked.user.email,
          name: linked.user.name,
          providers: linked.user.accounts.map((account) => account.provider),
        };
      },
    }),
  );
}

export const { handlers, auth, signIn } = NextAuth({
  providers,
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  callbacks: {
    async signIn({ user, account }) {
      if (!account || account.provider === "dev-link") return true;
      const provider = account.provider as ProviderId;
      if (!PROVIDERS.includes(provider)) return false;
      const linked = linkIdentity(readUsers(), {
        provider,
        providerAccountId: account.providerAccountId,
        email: user.email,
        name: user.name,
      });
      writeUsers(linked.users);
      user.id = linked.user.id;
      user.providers = linked.user.accounts.map((item) => item.provider);
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.providers = user.providers ?? [];
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = String(token.uid ?? "");
      session.providers = Array.isArray(token.providers) ? token.providers.map(String) : [];
      return session;
    },
  },
});
