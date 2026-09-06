"use client";

import { useCallback, useEffect, useState } from "react";
import { PencilLine, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { RequireAuth } from "@/components/require-auth";
import { COLLECTIONS } from "@/lib/permissions";
import type { Paint } from "@/lib/db";

const RGB_FIELDS = [
  { key: "r", label: "Red (0–255)" },
  { key: "g", label: "Green (0–255)" },
  { key: "b", label: "Blue (0–255)" },
] as const satisfies ReadonlyArray<{ key: "r" | "g" | "b"; label: string }>;

export default function UpdatePaintPage() {
  const [paints, setPaints] = useState<Paint[]>([]);
  const [paintsLoading, setPaintsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");
  const [form, setForm] = useState<Paint | null>(null);
  const [collection, setCollection] = useState<string>("");
  const [rgb, setRgb] = useState({ r: "", g: "", b: "" });
  const [errors, setErrors] = useState<string[]>([]);
  const [updated, setUpdated] = useState<Paint | null>(null);
  const [saving, setSaving] = useState(false);

  const loadPaints = useCallback(async () => {
    try {
      const res = await fetch("/api/paints", { cache: "no-store" });
      const body = (await res.json()) as { ok: boolean; data?: { paints: Paint[] } };
      if (res.ok && body.ok) setPaints(body.data!.paints);
    } catch {
      toast.error("Could not load paints.");
    } finally {
      setPaintsLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void loadPaints(), 0);
    return () => clearTimeout(t);
  }, [loadPaints]);

  function handleSelect(id: string) {
    setSelectedId(id);
    setUpdated(null);
    setErrors([]);
    const paint = paints.find((p) => String(p.id) === id);
    if (paint) {
      setForm(paint);
      setCollection(paint.collection);
      setRgb({ r: String(paint.r), g: String(paint.g), b: String(paint.b) });
    } else {
      setForm(null);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setErrors([]);
    setUpdated(null);

    const r = Number(rgb.r);
    const g = Number(rgb.g);
    const b = Number(rgb.b);
    const issues: string[] = [];
    if (!form.paint_name.trim()) issues.push("Paint name is required.");
    if (!form.old_number.trim()) issues.push("Old paint number is required.");
    if (!form.new_number.trim()) issues.push("New paint number is required.");
    if (!collection) issues.push("Collection is required.");
    if (!Number.isInteger(r) || r < 0 || r > 255) issues.push("Red value must be an integer 0–255.");
    if (!Number.isInteger(g) || g < 0 || g > 255) issues.push("Green value must be an integer 0–255.");
    if (!Number.isInteger(b) || b < 0 || b > 255) issues.push("Blue value must be an integer 0–255.");
    if (issues.length > 0) {
      setErrors(issues);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/paints/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paint_name: form.paint_name.trim(),
          old_number: form.old_number.trim(),
          new_number: form.new_number.trim(),
          collection,
          r,
          g,
          b,
        }),
      });
      const body = (await res.json()) as { ok: boolean; error?: string; data?: Paint };
      if (!res.ok || !body.ok) {
        setErrors([body.error ?? "Could not update paint."]);
        return;
      }
      setUpdated(body.data!);
      setForm(body.data!);
      toast.success(`Updated "${body.data!.paint_name}"`);
      await loadPaints();
    } catch {
      setErrors(["Unexpected error while updating paint."]);
    } finally {
      setSaving(false);
    }
  }

  return (
    <RequireAuth permission="paint:update">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div>
          <h1 className="text-3xl">Update Paint</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a paint record, edit its details, and save.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Select a paint</CardTitle>
            <CardDescription>Pick the record you want to update.</CardDescription>
          </CardHeader>
          <CardContent>
            {paintsLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select value={selectedId} onValueChange={handleSelect}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a paint" />
                </SelectTrigger>
                <SelectContent>
                  {paints.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.paint_name} — {p.collection} (Old {p.old_number} → New {p.new_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {form && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">2. Edit details</CardTitle>
              <CardDescription>Change any field below and save the update.</CardDescription>
            </CardHeader>
            <CardContent>
              {errors.length > 0 && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTitle>Could not update paint</AlertTitle>
                  <AlertDescription>
                    <ul className="list-inside list-disc">
                      {errors.map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {updated && (
                <Alert className="mb-4">
                  <CheckCircle2 className="size-4" />
                  <AlertTitle>Paint updated</AlertTitle>
                  <AlertDescription>“{updated.paint_name}” was saved successfully.</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSave} className="grid gap-4">
                {[
                  { key: "paint_name", label: "Paint name" },
                  { key: "old_number", label: "Old paint number" },
                  { key: "new_number", label: "New paint number" },
                ].map((f) => (
                  <div className="grid gap-2" key={f.key}>
                    <Label htmlFor={`edit-${f.key}`}>{f.label}</Label>
                    <Input
                      id={`edit-${f.key}`}
                      value={form[f.key as "paint_name" | "old_number" | "new_number"]}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      className="w-full"
                    />
                  </div>
                ))}

                <div className="grid gap-2">
                  <Label htmlFor="edit-collection">Collection</Label>
                  <Select value={collection} onValueChange={setCollection}>
                    <SelectTrigger id="edit-collection" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COLLECTIONS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {RGB_FIELDS.map((f) => (
                    <div className="grid gap-2" key={f.key}>
                      <Label htmlFor={`edit-${f.key}`}>{f.label}</Label>
                      <Input
                        id={`edit-${f.key}`}
                        type="number"
                        min={0}
                        max={255}
                        value={rgb[f.key]}
                        onChange={(e) => setRgb((prev) => ({ ...prev, [f.key]: e.target.value }))}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>

                <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <PencilLine className="size-4" />}
                  Save changes
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </RequireAuth>
  );
}