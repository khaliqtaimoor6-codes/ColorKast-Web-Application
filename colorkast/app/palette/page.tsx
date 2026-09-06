"use client";

import { useCallback, useEffect, useState } from "react";
import { Palette as PaletteIcon, Loader2, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PaintSwatch } from "@/components/paint-swatch";

interface PaletteEntry {
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
}

export default function PalettePage() {
  const [entries, setEntries] = useState<PaletteEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/palette", { cache: "no-store" });
      const body = (await res.json()) as { ok: boolean; data?: { entries: PaletteEntry[] } };
      if (res.ok && body.ok) setEntries(body.data!.entries);
    } catch {
      toast.error("Could not load your palette.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  async function handleRemove(entryId: number, name: string) {
    const res = await fetch("/api/palette", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entry_id: entryId }),
    });
    const body = (await res.json()) as { ok: boolean; error?: string; data?: { entries: PaletteEntry[] } };
    if (res.ok && body.ok) {
      setEntries(body.data!.entries);
      toast.success(`Removed "${name}" from your palette`);
    } else {
      toast.error(body.error ?? "Could not remove entry.");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-3xl">My Color Palette</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your recent color searches, kept handy for this session.
        </p>
      </div>

      <Card className="flex items-center gap-3 bg-muted/40 p-4">
        <Clock className="size-4 shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Palette data is private to you. In line with the SRS, entries are removed from the
          server after 30 days.
        </p>
      </Card>

      {loading ? (
        <div className="flex items-center gap-3 rounded-xl border p-8 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading palette…
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
          <PaletteIcon className="size-8 text-muted-foreground" />
          <p className="font-medium">Your palette is empty.</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Search for colors or translate a number, then use “Add to palette” to keep recent
            colors here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <Card key={entry.entry_id}>
              <div className="flex items-center gap-4 p-4">
                <PaintSwatch r={entry.r} g={entry.g} b={entry.b} size={56} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold">{entry.paint_name}</p>
                    <Badge variant="secondary">{entry.collection}</Badge>
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    Old {entry.old_number} → New {entry.new_number} · RGB {entry.r},{entry.g},{entry.b}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 text-destructive hover:text-destructive"
                  onClick={() => void handleRemove(entry.entry_id, entry.paint_name)}
                >
                  <Trash2 className="size-4" />
                  <span className="hidden sm:inline">Remove</span>
                </Button>
              </div>
            </Card>
          ))}
          <Separator />
          <p className="text-xs text-muted-foreground">
            Session-scoped prototype. Reloads preserve entries via your browser session.
          </p>
        </div>
      )}
    </div>
  );
}