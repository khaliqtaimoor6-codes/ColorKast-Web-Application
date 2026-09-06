import { getDb, type Paint } from "@/lib/db";

// Design decision (B): the SRS says search may return an arbitrary number of
// matches but no maximum is specified. A limit of 50 keeps the UI usable.
export const MAX_RESULTS = 50;

export type SearchType = "name" | "number" | "rgb";

export interface SearchParams {
  type: SearchType;
  value: string;
  collection: string; // "ALL" or a specific collection name
}

export interface SearchOutcome {
  ok: boolean;
  results?: Paint[];
  count?: number;
  error?: string;
}

function rowToPaint(row: unknown): Paint {
  const p = row as Paint;
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

export function parseRgbInput(value: string): { r: number; g: number; b: number } | null {
  const parts = value.split(",").map((s) => s.trim());
  if (parts.length !== 3) return null;
  const nums = parts.map((s) => Number(s));
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return { r: nums[0], g: nums[1], b: nums[2] };
}

// FR1 — Color Search. Locates colors by paint name, paint number, or exact RGB
// value, optionally restricted to a single collection.
export function searchPaints(params: SearchParams): SearchOutcome {
  const db = getDb();
  const value = params.value.trim();

  if (!value) {
    return { ok: false, error: "Search value is required." };
  }

  let rows: Paint[];
  if (params.type === "name") {
    rows = db
      .prepare(
        `SELECT * FROM paints WHERE paint_name LIKE @pattern
         ${params.collection === "ALL" ? "" : "AND collection = @collection"}
         ORDER BY paint_name, collection LIMIT @limit`,
      )
      .all({ pattern: `%${value}%`, collection: params.collection, limit: MAX_RESULTS }) as Paint[];
  } else if (params.type === "number") {
    rows = db
      .prepare(
        `SELECT * FROM paints
         WHERE (old_number LIKE @pattern OR new_number LIKE @pattern)
         ${params.collection === "ALL" ? "" : "AND collection = @collection"}
         ORDER BY old_number, collection LIMIT @limit`,
      )
      .all({ pattern: `%${value}%`, collection: params.collection, limit: MAX_RESULTS }) as Paint[];
  } else {
    const rgb = parseRgbInput(value);
    if (!rgb) {
      return {
        ok: false,
        error: "RGB search value must be three comma-separated integers, each 0–255 (e.g. 30,90,180).",
      };
    }
    rows = db
      .prepare(
        `SELECT * FROM paints WHERE r = @r AND g = @g AND b = @b
         ${params.collection === "ALL" ? "" : "AND collection = @collection"}
         ORDER BY paint_name LIMIT @limit`,
      )
      .all({ ...rgb, collection: params.collection, limit: MAX_RESULTS }) as Paint[];
  }

  return { ok: true, results: rows.map(rowToPaint), count: rows.length };
}

// FR2 — Color Number Translation. Finds the paint by its old-scheme number in
// the source collection, then locates the counterpart record for the same
// color in the target collection and returns the target scheme number.
export interface TranslateResult {
  source: Paint;
  target: Paint;
  converted: boolean;
}

export function translateNumber(oldNumber: string, sourceCollection: string, targetCollection: string): TranslateResult | null {
  const db = getDb();
  const source = db
    .prepare("SELECT * FROM paints WHERE old_number = ? AND collection = ?")
    .get(oldNumber.trim(), sourceCollection) as Paint | undefined;

  if (!source) return null;

  const target = (db
    .prepare("SELECT * FROM paints WHERE paint_name = ? AND collection = ?")
    .get(source.paint_name, targetCollection) as Paint | undefined) ?? source;

  return {
    source,
    target,
    converted: target.id !== source.id,
  };
}

// FR3 — Closest Colors. RGB Euclidean distance (design decision supported by
// the SRS, which assumes nearest colors in RGB space are acceptable).
export interface ClosestResult extends Paint {
  distance: number;
  distanceRounded: number;
}

export function rgbDistance(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

export function closestColors(input: { r: number; g: number; b: number; count: number; collection: string }): ClosestResult[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM paints
       ${input.collection === "ALL" ? "" : "WHERE collection = @collection"}
       ORDER BY paint_name`,
    )
    .all(input.collection === "ALL" ? {} : { collection: input.collection }) as Paint[];

  return rows
    .map((p) => {
      const distance = rgbDistance(input, p);
      return { ...p, distance, distanceRounded: Math.round(distance * 100) / 100 };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, input.count);
}

// FR4 — Palette helpers.
export function addToPalette(paletteId: string, paintId: number): boolean {
  const db = getDb();
  const paint = db.prepare("SELECT id FROM paints WHERE id = ?").get(paintId);
  if (!paint) return false;

  const existing = db
    .prepare("SELECT id FROM palette WHERE palette_id = ? AND paint_id = ?")
    .get(paletteId, paintId);
  if (!existing) {
    // Palette id collisions are improbable (UUID), but keep a unique key anyway.
    db.prepare("INSERT INTO palette (palette_id, paint_id) VALUES (?, ?)").run(paletteId, paintId);
  }
  return true;
}

export function removeFromPalette(paletteId: string, paletteEntryId: number): boolean {
  const db = getDb();
  const res = db
    .prepare("DELETE FROM palette WHERE palette_id = ? AND id = ?")
    .run(paletteId, paletteEntryId);
  return res.changes > 0;
}

export function getPaletteEntries(paletteId: string, limit = 20) {
  const db = getDb();
  return db
    .prepare(
      `SELECT p.id AS paint_id, p.paint_name, p.old_number, p.new_number, p.collection,
              p.r, p.g, p.b, pl.id AS entry_id, pl.added_at
       FROM palette pl JOIN paints p ON p.id = pl.paint_id
       WHERE pl.palette_id = ?
       ORDER BY pl.added_at DESC
       LIMIT ?`,
    )
    .all(paletteId, limit) as Array<{
    paint_id: number;
    paint_name: string;
    old_number: string;
    new_number: string;
    collection: string;
    r: number;
    g: number;
    b: number;
    entry_id: number;
    added_at: string;
  }>;
}

// Simple measurement helper used by the search route to expose server-side
// processing time to the performance (NFR1) evaluation.
export function measure<T>(fn: () => T): { result: T; processingMs: number } {
  const start = performance.now();
  const result = fn();
  const processingMs = Math.round((performance.now() - start) * 100) / 100;
  return { result, processingMs };
}