"use client";

import { useState } from "react";
import { Search, Loader2, Palette, Check } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { PaintSwatch } from "@/components/paint-swatch";
import { COLLECTIONS } from "@/lib/permissions";
import type { Paint } from "@/lib/db";

interface SearchResult {
  results: Paint[];
  count: number;
  processingMs: number;
}

export default function SearchPage() {
  const [type, setType] = useState("name");
  const [value, setValue] = useState("");
  const [collection, setCollection] = useState("ALL");
  const [data, setData] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState<Set<number>>(new Set());

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const params = new URLSearchParams({ type, value, collection });
      const res = await fetch(`/api/search?${params.toString()}`, { cache: "no-store" });
      const body = (await res.json()) as { ok: boolean; error?: string; data?: SearchResult };
      if (!res.ok || !body.ok) {
        setData(null);
        setError(body.error ?? "Search failed.");
        return;
      }
      setData(body.data!);
      const next = new Set<number>();
      body.data!.results.forEach((p) => {
        if (added.has(p.id)) next.add(p.id);
      });
      setAdded(next);
    } catch {
      setError("Unexpected error during search.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToPalette(paint: Paint) {
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
        <h1 className="text-3xl">Color Search</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Locate colors by paint name, paint number, or RGB value — in any collection.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search parameters</CardTitle>
          <CardDescription>Choose what to search by, then enter a value.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="type">Search type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Paint name</SelectItem>
                    <SelectItem value="number">Paint number</SelectItem>
                    <SelectItem value="rgb">RGB value</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="value">Search value</Label>
                <Input
                  id="value"
                  placeholder={type === "rgb" ? "e.g. 30,90,180" : type === "number" ? "e.g. A101 or B205" : "e.g. Ocean Blue"}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="grid gap-2">
                <Label htmlFor="collection">Collection</Label>
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
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                Search
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>No search results</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {data && data.results.length === 0 && !error && (
        <Alert>
          <AlertTitle>No colors found</AlertTitle>
          <AlertDescription>
            No paints matched your search. Try a different name, number, or RGB value.
          </AlertDescription>
        </Alert>
      )}

      {data && data.results.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>
              {data.count} result{data.count === 1 ? "" : "s"} found
            </span>
            <Separator orientation="vertical" className="h-4" />
            <span>Server processing: {data.processingMs.toFixed(2)} ms</span>
          </div>

          {data.results.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <PaintSwatch r={p.r} g={p.g} b={p.b} size={56} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold">{p.paint_name}</p>
                    <Badge variant="secondary">{p.collection}</Badge>
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    Old {p.old_number} → New {p.new_number}
                  </p>
                </div>
                <Button
                  variant={added.has(p.id) ? "ghost" : "outline"}
                  size="sm"
                  className="shrink-0"
                  onClick={() => void handleAddToPalette(p)}
                >
                  {added.has(p.id) ? (
                    <>
                      <Check className="size-4" />
                      Added
                    </>
                  ) : (
                    <>
                      <Palette className="size-4" />
                      Add to palette
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}