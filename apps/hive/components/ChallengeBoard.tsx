"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Card } from "@liveaskew/ui";

type Entry = { id: string; author: string; text: string };

export function ChallengeBoard() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    void fetch("/api/messages?room=challenge")
      .then((response) => response.json())
      .then((payload: { messages: Entry[] }) => setEntries(payload.messages ?? []));
  }, []);

  async function enter(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/messages", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ roomId: "challenge", author: "Amina", text }),
    });
    if (!response.ok) return;
    const entry = (await response.json()) as Entry;
    setEntries((current) => [...current, entry]);
    setText("");
  }

  return (
    <div className="stack">
      <div>
        <p className="kicker">Style challenge</p>
        <h1
          style={{
            fontFamily: "Times New Roman, serif",
            fontWeight: 500,
            fontSize: "3rem",
            margin: "8px 0",
          }}
        >
          Boardroom on a Wednesday.
        </h1>
        <p className="muted">
          One sentence with the look. Maternity counts. So does the school run before it.
        </p>
      </div>
      <Card className="pad">
        <form className="stack" onSubmit={enter}>
          <textarea
            className="neo-textarea"
            rows={3}
            value={text}
            onChange={(event) => setText(event.target.value)}
            aria-label="Challenge entry"
          />
          <Button type="submit">Enter the challenge</Button>
        </form>
      </Card>
      {entries.map((entry) => (
        <Card key={entry.id} className="pad">
          <strong>{entry.author}</strong>
          <p>{entry.text}</p>
        </Card>
      ))}
    </div>
  );
}
