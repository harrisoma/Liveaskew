import { redirect } from "next/navigation";
import { Card } from "@liveaskew/ui";
import { auth } from "@/auth";
import { readUsers } from "@/lib/users";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const member = readUsers().find((user) => user.id === session.user.id);
  const providers = member?.accounts.map((account) => account.provider) ?? session.providers;

  return (
    <Card className="pad stack" style={{ maxWidth: 560 }}>
      <p className="kicker">One member</p>
      <h1 style={{ fontFamily: "Times New Roman, serif", fontWeight: 500, margin: 0 }}>
        {session.user.name ?? "Hive member"}
      </h1>
      <p className="muted">{session.user.email}</p>
      <p>Linked platforms</p>
      <ul>
        {providers.map((provider) => (
          <li key={provider}>{provider}</li>
        ))}
      </ul>
      <a className="neo-link" href="/messages">
        Enter the rooms
      </a>
    </Card>
  );
}
