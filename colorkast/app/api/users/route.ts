import { err, ok, nonEmptyString } from "@/lib/api";
import { can, roleRank, type Role } from "@/lib/permissions";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const CREATABLE_ROLES: Role[] = ["ADMIN_L1", "ADMIN_L2", "ADMIN_L3"];

function serializeUser(u: Record<string, unknown>) {
  return { id: u.id, username: u.username, role: u.role };
}

// FR7 — Administrative user list. Only users with the users:manage permission
// (Level 3) may see the management list.
export async function GET() {
  const user = await getSessionUser();
  if (!user) return err("Authentication required.", 401);
  if (!can(user.role, "users:manage")) {
    return err("Your permission level does not allow managing administrative users.", 403);
  }

  const rows = getDb()
    .prepare("SELECT id, username, role FROM users WHERE role != 'USER' ORDER BY id")
    .all() as Array<Record<string, unknown>>;
  return ok({ users: rows.map(serializeUser) });
}

// FR7 — Create an administrative user. The SRS constrains creation by level:
// a creator may create users at or below their own level.
export async function POST(request: Request) {
  const actor = await getSessionUser();
  if (!actor) return err("Authentication required.", 401);
  if (!can(actor.role, "users:manage")) {
    return err("Your permission level does not allow managing administrative users.", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Invalid request body.", 400);
  }

  const b = (body ?? {}) as Record<string, unknown>;
  const username = b.username;
  const password = b.password;
  const role = b.role as Role;

  if (!nonEmptyString(username)) return err("Username is required.", 400);
  if (!nonEmptyString(password)) return err("Password is required.", 400);
  if (password.length < 4) {
    return err("Password must be at least 4 characters.", 400);
  }
  if (!CREATABLE_ROLES.includes(role)) {
    return err("Role must be one of: ADMIN_L1, ADMIN_L2, ADMIN_L3.", 400);
  }
  if (roleRank(role) > roleRank(actor.role)) {
    return err(`You may only create administrative users at or below your own level.`, 403);
  }

  const db = getDb();
  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
  if (existing) {
    return err(`A user named "${username}" already exists.`, 409);
  }

  const info = db
    .prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)")
    .run(username, password, role);

  const row = db.prepare("SELECT id, username, role FROM users WHERE id = ?").get(info.lastInsertRowid) as Record<
    string,
    unknown
  >;
  return ok(serializeUser(row), 201);
}