"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Card } from "@liveaskew/ui";

type Message = { id: string; author: string; text: string; createdAt: string };

const ROOMS = [
  { id: "motherhood", name: "Motherhood" },
  { id: "style", name: "Style" },
  { id: "everyday", name: "Everyday" },
  { id: "editorial", name: "Editorial" },
  { id: "circle", name: "Wednesday circle" },
  { id: "dm-june", name: "DM · June" },
];

export function RoomChat() {
  const params = useSearchParams();
  const room = params.get("room") ?? "motherhood";
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    let ignore = false;
    void fetch(`/api/messages?room=${room}`)
      .then((response) => response.json())
      .then((payload: { messages: Message[] }) => {
        if (!ignore) setMessages(payload.messages ?? []);
      });
    return () => {
      ignore = true;
    };
  }, [room]);

  async function send(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/messages", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ roomId: room, author: "Amina", text }),
    });
    if (!response.ok) return;
    const message = (await response.json()) as Message;
    setMessages((current) => [...current, message]);
    setText("");
  }

  return (
    <div className="stack">
      <div className="row">
        {ROOMS.map((item) => (
          <a
            key={item.id}
            className="neo-link"
            href={`/messages?room=${item.id}`}
            aria-current={item.id === room ? "page" : undefined}
          >
            {item.name}
          </a>
        ))}
      </div>
      <Card className="pad">
        <p className="kicker">
          {room === "dm-june" ? "Direct message" : room === "circle" ? "Group" : "Topic"}
        </p>
        <div className="chat-log">
          {messages.map((message) => (
            <div key={message.id} className="bubble">
              <strong>{message.author}</strong>
              <p style={{ margin: "6px 0 0" }}>{message.text}</p>
            </div>
          ))}
          {messages.length === 0 && <p className="muted">This room is quiet. Start it.</p>}
        </div>
        <form className="row" onSubmit={send}>
          <input
            className="neo-input"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Write to the Hive"
            aria-label="Message"
          />
          <Button type="submit">Send</Button>
        </form>
      </Card>
    </div>
  );
}
