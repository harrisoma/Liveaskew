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
  const [name, setName] = useState("");
  const [about, setAbout] = useState("");
  const [lesson, setLesson] = useState("");
  const [look, setLook] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [beeId, setBeeId] = useState("");
  const [platforms, setPlatforms] = useState<Platform[]>(["instagram", "tiktok"]);
  const [error, setError] = useState("");
  const [learned, setLearned] = useState<string[]>([]);

  async function refresh() {
    const response = await fetch("/api/looks");
    setData((await response.json()) as Payload);
  }

  useEffect(() => {
    void refresh();
  }, []);

  function onImage(file: File | undefined) {
    if (!file) return;
    if (file.size > 1_500_000) {
      setError("Use a photo under 1.5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageUrl(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
  }

  async function upload(event: FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/looks/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, about, lesson, look, imageUrl, platforms, beeId }),
    });
    const payload = (await response.json()) as { error?: string; learned?: string[] };
    if (!response.ok) {
      setError(payload.error ?? "Buzz did not take the look.");
      return;
    }
    setLearned(payload.learned ?? []);
    setLesson("");
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
          Grow your presence.
        </h1>
        <p className="muted">
          Elevate. Uplift. Broadcast to the world. Bee hands the look to Buzz. Onixus Social
          publishes it to Instagram, TikTok, Pinterest, Facebook, and LinkedIn once each account is
          connected.
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
          <p className="kicker">Upload</p>
          <form className="stack" onSubmit={upload}>
            <input
              className="neo-input"
              aria-label="Your name"
              placeholder="Your name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <textarea
              className="neo-textarea"
              rows={2}
              aria-label="About you"
              placeholder="Who you post for, and how you sound"
              value={about}
              onChange={(event) => setAbout(event.target.value)}
            />
            <textarea
              className="neo-textarea"
              rows={2}
              aria-label="Look"
              placeholder="What is in the photo"
              value={look}
              onChange={(event) => setLook(event.target.value)}
            />
            <input
              aria-label="Photo"
              type="file"
              accept="image/*"
              onChange={(event) => onImage(event.target.files?.[0])}
            />
            <textarea
              className="neo-textarea"
              rows={2}
              aria-label="Teach Buzz"
              placeholder="Teach Buzz — shorter, funnier, no boardroom"
              value={lesson}
              onChange={(event) => setLesson(event.target.value)}
            />
            <label className="muted">
              Bee interview, if you have one
              <select
                className="neo-input"
                aria-label="Bee interview"
                value={beeId}
                onChange={(event) => setBeeId(event.target.value)}
              >
                <option value="">I only have Buzz</option>
                <option value="amina">Amina Cole</option>
                <option value="june">June Adler</option>
              </select>
            </label>
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
            {learned.length > 0 && <p className="muted">Buzz remembers: {learned.join(" | ")}</p>}
            <Button type="submit">Upload look</Button>
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
          {data.looks.map((item) => (
            <Card key={item.id} className="look">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt=""
                  style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 16 }}
                />
              ) : null}
              {item.authorName ? (
                <p className="badge">
                  {item.authorName}
                  {item.signIn ? ` · ${item.signIn}` : ""}
                </p>
              ) : null}
              <strong>{item.caption}</strong>
              <p className="muted">
                {item.status} · {item.platforms.join(", ")}
              </p>
              {item.publishNote ? <p className="muted">{item.publishNote}</p> : null}
              {(item.captions ?? []).map((caption) => (
                <p key={caption.platform}>
                  <span className="badge">{caption.platform}</span> {caption.text}
                </p>
              ))}
              <div className="row">
                <Button type="button" onClick={() => update(item.id, "schedule")}>
                  Schedule
                </Button>
                <Button type="button" onClick={() => update(item.id, "posted")}>
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
