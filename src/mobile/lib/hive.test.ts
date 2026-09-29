import { describe, expect, it } from "vitest";
import { lookForHive, rowToMessage, upsertMessage, type HiveMessage } from "./hive";
import type { GuideLook } from "./storage";

const msg = (id: string, createdAt: string): HiveMessage => ({
  id,
  roomId: "style",
  userId: "u1",
  author: "June",
  body: "hi",
  look: null,
  hidden: false,
  createdAt,
});

describe("upsertMessage", () => {
  it("dedupes a realtime echo of our own insert and keeps time order", () => {
    const list = [msg("a", "2026-09-29T10:00:00Z"), msg("c", "2026-09-29T10:02:00Z")];
    const next = upsertMessage(
      upsertMessage(list, msg("b", "2026-09-29T10:01:00Z")),
      msg("b", "2026-09-29T10:01:00Z"),
    );
    expect(next.map((m) => m.id)).toEqual(["a", "b", "c"]);
  });

  it("caps the room history", () => {
    let list: HiveMessage[] = [];
    for (let i = 0; i < 5; i++)
      list = upsertMessage(list, msg(String(i), `2026-09-29T10:0${i}:00Z`), 3);
    expect(list.map((m) => m.id)).toEqual(["2", "3", "4"]);
  });
});

describe("rowToMessage", () => {
  it("drops a malformed look payload and bad colours", () => {
    const base = {
      id: "m1",
      room_id: "style",
      user_id: "u1",
      author_name: "",
      body: "hello",
      hidden: false,
      created_at: "2026-09-29T10:00:00Z",
    };
    expect(rowToMessage({ ...base, look: { nope: 1 } }).look).toBeNull();
    expect(rowToMessage({ ...base, look: null }).author).toBe("Member");
    expect(
      rowToMessage({
        ...base,
        look: { title: "T", formula: ["a", 2], palette: ["#111111", "red"] },
      }).look,
    ).toEqual({ title: "T", formula: ["a"], palette: ["#111111"] });
  });
});

describe("lookForHive", () => {
  it("keeps only what the room needs", () => {
    const look = {
      id: "l",
      title: "Monday column",
      occasion: "Work",
      formula: ["a", "b", "c"],
      fit: "",
      feel: "",
      fabric: "",
      palette: ["#111111", "#zzzzzz"],
      saved: true,
      createdAt: "",
      garmentNote: "",
      tryOnUrl: "data:image/png;base64,xxx",
      tryOnKey: null,
    } satisfies GuideLook;
    expect(lookForHive(look)).toEqual({
      title: "Monday column",
      formula: ["a", "b", "c"],
      palette: ["#111111"],
    });
  });
});
