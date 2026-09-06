import { err, ok, isRgbValue, nonEmptyString } from "@/lib/api";
import { can } from "@/lib/permissions";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

function serialize(p: Record<string, unknown>) {
  return {
    id: p.id,
    paint_name: p.paint_name,
    old_number: p.old_number,
    new_number: p.new_number,
    collection: p.collection,
    r: p.r,
    g: p.g,
    b: p.b,
  };
}

// Public listing used by the admin update/delete flows.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const collection = url.searchParams.get("collection");
  const q = url.searchParams.get("q");

  const db = getDb();
  let rows: Array<Record<string, unknown>> = [];
  if (collection && collection !== "ALL") {
    const query = q
      ? `SELECT * FROM paints WHERE collection = ? AND paint_name LIKE ? ORDER BY paint_name, collection LIMIT 100`
      : `SELECT * FROM paints WHERE collection = ? ORDER BY paint_name, collection LIMIT 100`;
    rows = db.prepare(query).all(...(q ? [collection, `%${q}%`] : [collection])) as Array<Record<string, unknown>>;
  } else {
    const query = q
      ? `SELECT * FROM paints WHERE paint_name LIKE ? ORDER BY paint_name, collection LIMIT 100`
      : `SELECT * FROM paints ORDER BY paint_name, collection LIMIT 100`;
    rows = db.prepare(query).all(...(q ? [`%${q}%`] : [])) as Array<Record<string, unknown>>;
  }

  return ok({ paints: rows.map(serialize) });
}

// FR5 — Add paint information (requires paint:add permission).
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return err("Authentication required.", 401);
  if (!can(user.role, "paint:add")) {
    return err("Your permission level does not allow adding paint information.", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Invalid request body.", 400);
  }

  const b = (body ?? {}) as Record<string, unknown>;
  const paint_name = typeof b.paint_name === "string" ? b.paint_name : "";
  const old_number = typeof b.old_number === "string" ? b.old_number : "";
  const new_number = typeof b.new_number === "string" ? b.new_number : "";
  const collection = typeof b.collection === "string" ? b.collection : "";
  const r = b.r;
  const g = b.g;
  const b2 = b.b;

  // FR5 validation rules (defensible, implemented rules only).
  if (!nonEmptyString(paint_name)) return err("Paint name is required.", 400);
  if (!nonEmptyString(old_number)) return err("Old paint number is required.", 400);
  if (!nonEmptyString(new_number)) return err("New paint number is required.", 400);
  if (!nonEmptyString(collection)) return err("Collection is required.", 400);
  if (!isRgbValue(r) || !isRgbValue(g) || !isRgbValue(b2)) {
    return err("RGB values must be integers between 0 and 255.", 400);
  }

  const db = getDb();
  const existing = db.prepare("SELECT id FROM paints WHERE old_number = ?").get(old_number.trim());
  if (existing) {
    return err(`A paint with old number "${old_number.trim()}" already exists.`, 409);
  }

  const info = db
    .prepare(
      `INSERT INTO paints (paint_name, old_number, new_number, collection, r, g, b)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(paint_name, old_number.trim(), new_number.trim(), collection, r, g, b2);

  const row = db.prepare("SELECT * FROM paints WHERE id = ?").get(info.lastInsertRowid) as Record<
    string,
    unknown
  >;
  return ok(serialize(row), 201);
}