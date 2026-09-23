import { Card } from "@liveaskew/ui";
import { listRooms } from "@/lib/rooms";

export default function RoomsPage() {
  const rooms = listRooms();
  return (
    <div className="stack">
      <div>
        <p className="kicker">hive.liveaskew.com</p>
        <h1
          className="display"
          style={{
            fontFamily: "Times New Roman, serif",
            fontWeight: 500,
            fontSize: "3.4rem",
            margin: "8px 0",
          }}
        >
          One Hive. Every platform.
        </h1>
        <p className="muted">
          Google, Apple, Instagram, Facebook, and TikTok sign in to the same member. Topic rooms, a
          group, and direct messages live here.
        </p>
      </div>
      <div className="room-grid">
        {rooms.map((room) => (
          <a
            key={room.id}
            href={room.kind === "challenge" ? "/challenges" : `/messages?room=${room.id}`}
          >
            <Card className="pad">
              <p className="kicker">{room.kind}</p>
              <h2 style={{ margin: "8px 0" }}>{room.name}</h2>
              <p className="muted">{room.blurb}</p>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
