export const PROVIDERS = ["google", "apple", "instagram", "facebook", "tiktok"] as const;

export type ProviderId = (typeof PROVIDERS)[number];

export type Identity = {
  provider: ProviderId;
  providerAccountId: string;
  email?: string | null;
  name?: string | null;
};

export type HiveUser = {
  id: string;
  email: string | null;
  name: string | null;
  accounts: { provider: ProviderId; providerAccountId: string }[];
};

function cleanEmail(email?: string | null) {
  const value = email?.trim().toLowerCase() ?? "";
  return value.length > 0 ? value : null;
}

export function linkIdentity(users: HiveUser[], identity: Identity) {
  const email = cleanEmail(identity.email);
  const name = identity.name?.trim() || null;
  const existingAccount = users.find((user) =>
    user.accounts.some(
      (account) =>
        account.provider === identity.provider &&
        account.providerAccountId === identity.providerAccountId,
    ),
  );

  if (existingAccount) {
    const user = {
      ...existingAccount,
      email: existingAccount.email ?? email,
      name: name ?? existingAccount.name,
    };
    return { user, users: users.map((item) => (item.id === user.id ? user : item)) };
  }

  const byEmail = email ? users.find((user) => user.email === email) : undefined;
  if (byEmail) {
    const user: HiveUser = {
      ...byEmail,
      name: byEmail.name ?? name,
      accounts: [
        ...byEmail.accounts,
        { provider: identity.provider, providerAccountId: identity.providerAccountId },
      ],
    };
    return { user, users: users.map((item) => (item.id === user.id ? user : item)) };
  }

  const user: HiveUser = {
    id: crypto.randomUUID(),
    email,
    name,
    accounts: [{ provider: identity.provider, providerAccountId: identity.providerAccountId }],
  };
  return { user, users: [...users, user] };
}
