"use client";

import { useState } from "react";
import { Target, Loader2, Palette, Check } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { PaintSwatch } from "@/components/paint-swatch";
import { COLLECTIONS } from "@/lib/permissions";

interface ClosestRow {
  id: number;
  paint_name: string;
  old_number: string;
  new_number: string;
  collection: string;
  r: number;
  g: number;
  b: number;
  distance: number;
  distanceRounded: number;
}

const MIN_COUNT = 1;
const MAX_COUNT = 50;

export default function ClosestPage() {
  const [r, setR] = useState("200");
  const [g, setG] = useState("50");
  const [b, setB] = useState("60");
  const [count, setCount] = useState("5");
  const [collection, setCollection] = useState("ALL");
  const [rows, setRows] = useState<ClosestRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState<Set<number>>(new Set());

  async function handleFind(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const params = new URLSearchParams({ r, g, b, count, collection });
      const res = await fetch(`/api/closest?${params.toString()}`, { cache: "no-store" });
      const body = (await res.json()) as { ok: boolean; error?: string; data?: { results: ClosestRow[] } };
      if (!res.ok || !body.ok) {
        setRows(null);
        setError(body.error ?? "Request failed.");
        return;
      }
      setRows(body.data!.results);
    } catch {
      setError("Unexpected error during request.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToPalette(paint: ClosestRow) {
    const res = await fetch("/api/palette", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paint_id: paint.id }),
    });
    const body = (await res.json()) as { ok: boolean; error?: string };
    if (res.ok && body.ok) {
      setAdded((prev) => new Set(prev).add(paint.id));
      toast.success(`Added "${paint.paint_name}" to your palette`);
    } else {
      toast.error(body.error ?? "Could not add to palette.");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-3xl">Closest Colors</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Find the nearest matching colors to any target color within a collection, using RGB
          distance.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Color reference</CardTitle>
          <CardDescription>
            Result count is limited to between {MIN_COUNT} and {MAX_COUNT} (design decision).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFind} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Red (0–255)", state: r, set: setR, id: "r" },
                { label: "Green (0–255)", state: g, set: setG, id: "g" },
                { label: "Blue (0–255)", state: b, set: setB, id: "b" },
              ].map((f) => (
                <div className="grid gap-2" key={f.id}>
                  <Label htmlFor={f.id}>{f.label}</Label>
                  <Input
                    id={f.id}
                    type="number"
                    min={0}
                    max={255}
                    value={f.state}
                    onChange={(e) => f.set(e.target.value)}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="count">Number of results ({MIN_COUNT}–{MAX_COUNT})</Label>
                <Input
                  id="count"
                  type="number"
                  min={MIN_COUNT}
                  max={MAX_COUNT}
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="collection">Target collection</Label>
                <Select value={collection} onValueChange={setCollection}>
                  <SelectTrigger id="collection" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All collections</SelectItem>
                    {COLLECTIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Target className="size-4" />}
              Find closest
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Could not find colors</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {rows && rows.length === 0 && !error && (
        <Alert>
          <AlertTitle>No colors in this collection</AlertTitle>
          <AlertDescription>There are no paints in the selected scope to compare against.</AlertDescription>
        </Alert>
      )}

      {rows && rows.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {rows.length} closest color{rows.length === 1 ? "" : "s"} to RGB ({r},{g},{b}), sorted by
            Euclidean distance.
          </p>
          {rows.map((row, index) => (
            <Card key={row.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex w-10 shrink-0 flex-col items-center">
                  <span className="text-sm font-bold text-muted-foreground">#{index + 1}</span>
                </div>
                <PaintSwatch r={row.r} g={row.g} b={row.b} size={56} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold">{row.paint_name}</p>
                    <Badge variant="secondary">{row.collection}</Badge>
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    Old {row.old_number} → New {row.new_number}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-sm">{row.distanceRounded.toFixed(2)}</p>
                  <p className="text-[10px] text-muted-foreground">distance</p>
                </div>
                <Button
                  variant={added.has(row.id) ? "ghost" : "outline"}
                  size="sm"
                  className="shrink-0"
                  onClick={() => void handleAddToPalette(row)}
                >
                  {added.has(row.id) ? <Check className="size-4" /> : <Palette className="size-4" />}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}