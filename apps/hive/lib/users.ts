import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { HiveUser } from "@liveaskew/auth";

const file = path.join(process.cwd(), "data", "users.json");

export function readUsers(): HiveUser[] {
  if (!existsSync(file)) return [];
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8")) as unknown;
    return Array.isArray(parsed) ? (parsed as HiveUser[]) : [];
  } catch {
    return [];
  }
}

export function writeUsers(users: HiveUser[]) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(users, null, 2));
}
