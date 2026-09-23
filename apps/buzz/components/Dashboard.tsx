"use client";

import { useEffect, useState, type FormEvent } from "react";
import { BEST_TIMES, PLATFORMS, type LookRecord, type Platform } from "@liveaskew/api-client";
import { Button, Card } from "@liveaskew/ui";

type Payload = {
  looks: LookRecord[];
  counts: { queued: number; scheduled: number; posted: number };
};

const empty = { looks: [], counts: { queued: 0, scheduled: 0, posted: 0 } };

export function Dashboard() {
  const [data, setData] = useState<Payload>(empty);
  const [caption, setCaption] = useState("Stretch blazer, maternity boardroom, ivory silk");
  const [platforms, setPlatforms] = useState<Platform[]>(["instagram", "linkedin"]);
  const [error, setError] = useState("");

  async function refresh() {
    const response = await fetch("/api/looks");
    setData((await response.json()) as Payload);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function receive(event: FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/looks/transfer", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        lookId: crypto.randomUUID(),
        userId: "member-amina",
        imageUrl: "/buzz.png",
        caption,
        platforms,
        source: "bee",
      }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error ?? "Transfer failed");
      return;
    }
    await refresh();
  }

  function toggle(platform: Platform) {
    setPlatforms((current) =>
      current.includes(platform)
        ? current.filter((item) => item !== platform)
        : [...current, platform],
    );
  }

  async function update(id: string, action: "schedule" | "posted") {
    await fetch(`/api/looks/${id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await refresh();
  }

  return (
    <div className="stack">
      <div>
        <p className="kicker">buzz.liveaskew.com</p>
        <h1
          style={{
            fontFamily: "Times New Roman, serif",
            fontWeight: 500,
            fontSize: "3.2rem",
            margin: "8px 0",
          }}
        >
          The look, then the post.
        </h1>
        <p className="muted">
          Bee calls POST /api/looks/transfer. Buzz keeps the queue, the hour, and the tags.
        </p>
      </div>
      <div className="stats">
        {(["queued", "scheduled", "posted"] as const).map((key) => (
          <Card key={key} className="stat">
            <strong>{data.counts[key]}</strong>
            {key}
          </Card>
        ))}
      </div>
      <div className="split">
        <Card className="pad">
          <p className="kicker">From Bee</p>
          <form className="stack" onSubmit={receive}>
            <textarea
              className="neo-textarea"
              rows={3}
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              aria-label="Look caption"
            />
            <div className="row">
              {PLATFORMS.map((platform) => (
                <label key={platform} className="muted">
                  <input
                    type="checkbox"
                    checked={platforms.includes(platform)}
                    onChange={() => toggle(platform)}
                  />{" "}
                  {platform}
                </label>
              ))}
            </div>
            {error && <p>{error}</p>}
            <Button type="submit">Receive look</Button>
          </form>
          <div className="stack" style={{ marginTop: 18 }}>
            {PLATFORMS.map((platform) => (
              <p key={platform} className="muted">
                {platform} · {BEST_TIMES[platform].label}
              </p>
            ))}
          </div>
        </Card>
        <div className="stack">
          {data.looks.map((look) => (
            <Card key={look.id} className="look">
              <strong>{look.caption}</strong>
              <p className="muted">
                {look.status} · {look.platforms.join(", ")}
              </p>
              <p>{look.hashtags.join(" ")}</p>
              <div className="row">
                <Button type="button" onClick={() => update(look.id, "schedule")}>
                  Schedule
                </Button>
                <Button type="button" onClick={() => update(look.id, "posted")}>
                  Mark posted
                </Button>
              </div>
            </Card>
          ))}
          {data.looks.length === 0 && <p className="muted">Nothing queued yet.</p>}
        </div>
      </div>
    </div>
  );
}
