import { Card } from "@liveaskew/ui";
import { publicActors } from "@liveaskew/community";
import { readHive } from "@/lib/directory";

export default function PeoplePage() {
  const actors = publicActors(readHive());
  return (
    <div className="stack">
      <div>
        <p className="kicker">ActivityPub</p>
        <h1
          style={{
            fontFamily: "Times New Roman, serif",
            fontWeight: 500,
            fontSize: "3.2rem",
            margin: "8px 0",
          }}
        >
          Who is in the room.
        </h1>
        <p className="muted">
          The Hive uses ActivityPub, the open model behind Mastodon. A subscriber is a person. You
          see the platform they signed in with — Facebook, Instagram, and the rest — and you follow
          them there.
        </p>
      </div>
      <div className="room-grid">
        {actors.map((actor) => (
          <Card key={actor.id} className="pad stack">
            <p className="kicker">{actor.plan}</p>
            <h2 style={{ margin: 0 }}>{actor.name}</h2>
            <p className="badge">{actor.badge}</p>
            <a className="neo-link" href={actor.follow.href}>
              {actor.follow.label}
            </a>
          </Card>
        ))}
      </div>
    </div>
  );
}
