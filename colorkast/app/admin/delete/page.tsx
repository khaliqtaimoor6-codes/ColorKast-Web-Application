"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PaintSwatch } from "@/components/paint-swatch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RequireAuth } from "@/components/require-auth";
import type { Paint } from "@/lib/db";

export default function DeletePaintPage() {
  const [paints, setPaints] = useState<Paint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Paint | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState<string | null>(null);

  const loadPaints = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/paints", { cache: "no-store" });
      const body = (await res.json()) as { ok: boolean; data?: { paints: Paint[] } };
      if (res.ok && body.ok) setPaints(body.data!.paints);
    } catch {
      toast.error("Could not load paints.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void loadPaints(), 0);
    return () => clearTimeout(t);
  }, [loadPaints]);

  function handleSelect(id: string) {
    const paint = paints.find((p) => String(p.id) === id);
    setSelected(paint ?? null);
    setDeleted(null);
  }

  async function handleDelete() {
    if (!selected) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/paints/${selected.id}`, { method: "DELETE" });
      const body = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !body.ok) {
        toast.error(body.error ?? "Could not delete paint.");
        setConfirmOpen(false);
        return;
      }
      setDeleted(`${selected.paint_name} (${selected.old_number})`);
      setSelected(null);
      setConfirmOpen(false);
      toast.success(`Deleted "${selected.paint_name}"`);
      await loadPaints();
    } catch {
      toast.error("Unexpected error while deleting paint.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <RequireAuth permission="paint:delete">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div>
          <h1 className="text-3xl">Delete Paint</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Remove a paint record. Deletion requires confirmation and also removes the paint from
            any user palettes.
          </p>
        </div>

        {deleted && (
          <Alert>
            <CheckCircle2 className="size-4" />
            <AlertTitle>Paint deleted</AlertTitle>
            <AlertDescription>“{deleted}” is no longer available in search.</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select a paint to delete</CardTitle>
            <CardDescription>Deleting is irreversible.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {loading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select value={selected ? String(selected.id) : ""} onValueChange={handleSelect}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a paint" />
                </SelectTrigger>
                <SelectContent>
                  {paints.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.paint_name} — {p.collection} (Old {p.old_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {selected && (
              <div className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center">
                <PaintSwatch r={selected.r} g={selected.g} b={selected.b} size={56} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{selected.paint_name}</p>
                    <Badge variant="secondary">{selected.collection}</Badge>
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    Old {selected.old_number} → New {selected.new_number} · RGB {selected.r},
                    {selected.g},{selected.b}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  className="w-full sm:w-auto"
                  onClick={() => setConfirmOpen(true)}
                >
                  <Trash2 className="size-4" />
                  Delete paint
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to permanently delete “{selected?.paint_name}” (old number{" "}
                {selected?.old_number})? This cannot be undone and will also remove it from all
                palettes.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => void handleDelete()} disabled={deleting}>
                {deleting && <Loader2 className="size-4 animate-spin" />}
                Delete permanently
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RequireAuth>
  );
}