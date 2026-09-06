import { err, ok, isRgbValue, nonEmptyString } from "@/lib/api";
import { can } from "@/lib/permissions";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

type Params = Promise<{ id: string }>;

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

// FR6 — Update paint information (requires paint:update permission, Level 2+).
export async function PUT(request: Request, { params }: { params: Params }) {
  const { id } = await params;
  const paintId = Number(id);
  if (!Number.isInteger(paintId)) return err("Invalid paint id.", 400);

  const user = await getSessionUser();
  if (!user) return err("Authentication required.", 401);
  if (!can(user.role, "paint:update")) {
    return err("Your permission level does not allow updating paint information.", 403);
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

  if (!nonEmptyString(paint_name)) return err("Paint name is required.", 400);
  if (!nonEmptyString(old_number)) return err("Old paint number is required.", 400);
  if (!nonEmptyString(new_number)) return err("New paint number is required.", 400);
  if (!nonEmptyString(collection)) return err("Collection is required.", 400);
  if (!isRgbValue(r) || !isRgbValue(g) || !isRgbValue(b2)) {
    return err("RGB values must be integers between 0 and 255.", 400);
  }

  const db = getDb();
  const existing = db.prepare("SELECT id FROM paints WHERE id = ?").get(paintId);
  if (!existing) return err("Paint not found.", 404);

  const dup = db
    .prepare("SELECT id FROM paints WHERE old_number = ? AND id != ?")
    .get(old_number.trim(), paintId);
  if (dup) return err(`A paint with old number "${old_number.trim()}" already exists.`, 409);

  db.prepare(
    `UPDATE paints SET paint_name = ?, old_number = ?, new_number = ?, collection = ?, r = ?, g = ?, b = ?
     WHERE id = ?`,
  ).run(paint_name, old_number.trim(), new_number.trim(), collection, r, g, b2, paintId);

  const row = db.prepare("SELECT * FROM paints WHERE id = ?").get(paintId) as Record<string, unknown>;
  return ok(serialize(row));
}

// FR6 — Delete paint information (requires paint:delete permission, Level 3).
// Also removes the paint from any user palettes to keep data consistent.
export async function DELETE(_request: Request, { params }: { params: Params }) {
  const { id } = await params;
  const paintId = Number(id);
  if (!Number.isInteger(paintId)) return err("Invalid paint id.", 400);

  const user = await getSessionUser();
  if (!user) return err("Authentication required.", 401);
  if (!can(user.role, "paint:delete")) {
    return err("Your permission level does not allow deleting paint information.", 403);
  }

  const db = getDb();
  const existing = db.prepare("SELECT id FROM paints WHERE id = ?").get(paintId);
  if (!existing) return err("Paint not found.", 404);

  db.prepare("DELETE FROM palette WHERE paint_id = ?").run(paintId);
  const info = db.prepare("DELETE FROM paints WHERE id = ?").run(paintId);
  return ok({ deleted: info.changes > 0 });
}