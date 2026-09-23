"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Card } from "@liveaskew/ui";

type Actor = { id: string; name: string; badge: string };
type Topic = { id: string; name: string; content: string; author: string; badge: string };

export function Topics() {
  const [actors, setActors] = useState<Actor[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [authorId, setAuthorId] = useState("amina");
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    const payload = (await fetch("/api/topics").then((response) => response.json())) as {
      actors: Actor[];
      topics: Topic[];
    };
    setActors(payload.actors);
    setTopics(payload.topics);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function publish(event: FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/topics", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ authorId, name, content }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error ?? "The topic did not post.");
      return;
    }
    setName("");
    setContent("");
    await refresh();
  }

  return (
    <div className="stack">
      <div>
        <p className="kicker">Working mothers</p>
        <h1
          style={{
            fontFamily: "Times New Roman, serif",
            fontWeight: 500,
            fontSize: "3.2rem",
            margin: "8px 0",
          }}
        >
          Start a conversation.
        </h1>
        <p className="muted">
          Topics stay with the person who posted them, and with the platform they used to sign in.
        </p>
      </div>
      <Card className="pad">
        <form className="stack" onSubmit={publish}>
          <label className="muted">
            Speaking as
            <select
              className="neo-input"
              aria-label="Speaking as"
              value={authorId}
              onChange={(event) => setAuthorId(event.target.value)}
            >
              {actors.map((actor) => (
                <option key={actor.id} value={actor.id}>
                  {actor.name} · {actor.badge}
                </option>
              ))}
            </select>
          </label>
          <input
            className="neo-input"
            aria-label="Topic title"
            placeholder="The topic"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <textarea
            className="neo-textarea"
            rows={3}
            aria-label="Topic"
            placeholder="What do you want the Hive to talk about?"
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
          {error && <p>{error}</p>}
          <Button type="submit">Post topic</Button>
        </form>
      </Card>
      {topics.map((topic) => (
        <a key={topic.id} href={`/topics/${topic.id}`}>
          <Card className="pad">
            <p className="badge">
              {topic.author} · {topic.badge}
            </p>
            <h2 style={{ margin: "8px 0" }}>{topic.name}</h2>
            <p className="muted">{topic.content}</p>
          </Card>
        </a>
      ))}
    </div>
  );
}
