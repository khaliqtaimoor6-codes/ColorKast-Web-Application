import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { getDb, type User } from "@/lib/db";
import { seedIfEmpty } from "@/lib/seed";

const SESSION_COOKIE = "ck_session";
const PALETTE_COOKIE = "ck_palette";

export function toPublicUser(user: User) {
  return { id: user.id, username: user.username, role: user.role };
}

function rowToUser(row: unknown): User | null {
  const u = row as User;
  return u ? { id: u.id, username: u.username, password: u.password, role: u.role } : null;
}

export async function login(username: string, password: string): Promise<User | null> {
  seedIfEmpty();
  const db = getDb();
  const user = rowToUser(
    db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password)
  );
  if (!user) return null;

  const token = randomUUID();
  db.prepare("INSERT INTO sessions (token, user_id) VALUES (?, ?)").run(token, user.id);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return user;
}

export async function logout(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
  }
  store.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const row = getDb()
    .prepare(
      `SELECT u.id, u.username, u.password, u.role
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ?`
    )
    .get(token);
  return rowToUser(row);
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getSessionUser()) !== null;
}

// Palette identity: an opaque per-user id kept in a cookie so recent color
// searches persist across pages. SRS: palette data is private, not secure,
// removed after 30 days.
export async function getOrCreatePaletteId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(PALETTE_COOKIE)?.value;
  if (existing) return existing;

  const id = randomUUID();
  store.set(PALETTE_COOKIE, id, { httpOnly: true, sameSite: "lax", path: "/" });
  return id;
}

export async function getPaletteId(): Promise<string | null> {
  return (await cookies()).get(PALETTE_COOKIE)?.value ?? null;
}

