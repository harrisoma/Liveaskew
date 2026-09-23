"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Card } from "@liveaskew/ui";

type Reply = { id: string; content: string; author: string; badge: string };

export function Conversation({ topicId }: { topicId: string }) {
  const [topic, setTopic] = useState<{
    name: string;
    content: string;
    author: string;
    badge: string;
  } | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    const response = await fetch(`/api/topics/${topicId}`);
    if (!response.ok) return;
    const payload = (await response.json()) as {
      topic: NonNullable<typeof topic>;
      replies: Reply[];
    };
    setTopic(payload.topic);
    setReplies(payload.replies);
  }

  useEffect(() => {
    void refresh();
    // refresh closes over topicId, which is the only value that should reload the thread.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId]);

  async function send(event: FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch(`/api/topics/${topicId}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ authorId: "june", content }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error ?? "The reply did not send.");
      return;
    }
    setContent("");
    await refresh();
  }

  if (!topic) return <p className="muted">Opening the conversation…</p>;

  return (
    <div className="stack">
      <a className="neo-link" href="/topics">
        All topics
      </a>
      <Card className="pad">
        <p className="badge">
          {topic.author} · {topic.badge}
        </p>
        <h1
          style={{
            fontFamily: "Times New Roman, serif",
            fontWeight: 500,
            fontSize: "2.6rem",
            margin: "8px 0",
          }}
        >
          {topic.name}
        </h1>
        <p>{topic.content}</p>
      </Card>
      {replies.map((reply) => (
        <Card key={reply.id} className="pad">
          <p className="badge">
            {reply.author} · {reply.badge}
          </p>
          <p>{reply.content}</p>
        </Card>
      ))}
      <Card className="pad">
        <form className="stack" onSubmit={send}>
          <textarea
            className="neo-textarea"
            rows={3}
            aria-label="Reply"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Join as June, signed in with Instagram"
          />
          {error && <p>{error}</p>}
          <Button type="submit">Reply</Button>
        </form>
      </Card>
    </div>
  );
}
