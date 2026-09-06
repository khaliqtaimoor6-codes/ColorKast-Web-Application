import { err, ok } from "@/lib/api";
import { getOrCreatePaletteId, getPaletteId } from "@/lib/auth";
import { addToPalette, getPaletteEntries, removeFromPalette } from "@/lib/paints";
import { purgeStalePaletteEntries } from "@/lib/db";

export async function GET() {
  purgeStalePaletteEntries(); // SRS: palette data removed after 30 days.
  const paletteId = await getPaletteId();
  if (!paletteId) return ok({ entries: [] });
  return ok({ entries: getPaletteEntries(paletteId) });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Invalid request body.", 400);
  }

  const paintId = (body as { paint_id?: unknown } | undefined)?.paint_id;
  if (!Number.isInteger(paintId)) {
    return err("A valid paint id is required.", 400);
  }

  const paletteId = await getOrCreatePaletteId();
  purgeStalePaletteEntries();
  const added = addToPalette(paletteId, paintId as number);
  if (!added) {
    return err("Paint not found.", 404);
  }

  return ok({ entries: getPaletteEntries(paletteId) });
}

export async function DELETE(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Invalid request body.", 400);
  }

  const entryId = (body as { entry_id?: unknown } | undefined)?.entry_id;
  if (!Number.isInteger(entryId)) {
    return err("A valid palette entry id is required.", 400);
  }

  const paletteId = await getPaletteId();
  if (!paletteId) return ok({ entries: [] });

  removeFromPalette(paletteId, entryId as number);
  return ok({ entries: getPaletteEntries(paletteId) });
}