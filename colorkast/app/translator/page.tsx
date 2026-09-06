"use client";

import { useState } from "react";
import { ArrowRightLeft, Loader2, Palette, Check } from "lucide-react";
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

interface TranslateData {
  source: Paint;
  target: Paint;
  converted: boolean;
}

export default function TranslatePage() {
  const [oldNumber, setOldNumber] = useState("");
  const [source, setSource] = useState("Premium");
  const [target, setTarget] = useState("Classic");
  const [data, setData] = useState<TranslateData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  async function handleTranslate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setAdded(false);
    try {
      const params = new URLSearchParams({ old: oldNumber, source, target });
      const res = await fetch(`/api/translate?${params.toString()}`, { cache: "no-store" });
      const body = (await res.json()) as { ok: boolean; error?: string; data?: TranslateData };
      if (!res.ok || !body.ok) {
        setData(null);
        setError(body.error ?? "Translation failed.");
        return;
      }
      setData(body.data!);
    } catch {
      setError("Unexpected error during translation.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToPalette() {
    if (!data) return;
    const res = await fetch("/api/palette", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paint_id: data.target.id }),
    });
    const body = (await res.json()) as { ok: boolean; error?: string };
    if (res.ok && body.ok) {
      setAdded(true);
      toast.success(`Added "${data.target.paint_name}" to your palette`);
    } else {
      toast.error(body.error ?? "Could not add to palette.");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-3xl">Color Number Translator</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter an old-scheme number to see its equivalent in the new numbering scheme.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Translate a paint number</CardTitle>
          <CardDescription>
            The paint is looked up in the source collection and its number reported for the target
            collection.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTranslate} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="old">Old paint number</Label>
              <Input
                id="old"
                placeholder="e.g. A101"
                value={oldNumber}
                onChange={(e) => setOldNumber(e.target.value)}
                className="w-full max-w-md"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="source">Source collection</Label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger id="source" className="w-full">
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
              <div className="grid gap-2">
                <Label htmlFor="target">Target collection</Label>
                <Select value={target} onValueChange={setTarget}>
                  <SelectTrigger id="target" className="w-full">
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
            </div>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRightLeft className="size-4" />}
              Translate
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Translation failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {data && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                Source
                <Badge variant="secondary">{data.source.collection}</Badge>
              </CardTitle>
              <CardDescription className="font-mono text-xs">Old number {data.source.old_number}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <PaintSwatch r={data.source.r} g={data.source.g} b={data.source.b} size={56} />
              <div>
                <p className="font-semibold">{data.source.paint_name}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  RGB {data.source.r},{data.source.g},{data.source.b}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className={data.converted ? "border-primary/40" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                Result
                <Badge variant="secondary">{data.target.collection}</Badge>
              </CardTitle>
              <CardDescription className="font-mono text-xs">New number {data.target.new_number}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <PaintSwatch r={data.target.r} g={data.target.g} b={data.target.b} size={56} />
              <div className="min-w-0">
                <p className="font-semibold">{data.target.paint_name}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  RGB {data.target.r},{data.target.g},{data.target.b}
                </p>
                <Button variant="ghost" size="sm" className="mt-2 gap-1 px-0" onClick={() => void handleAddToPalette()}>
                  {added ? <Check className="size-3.5" /> : <Palette className="size-3.5" />}
                  {added ? "Added to palette" : "Add to palette"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Separator className="md:col-span-2" />
          <p className="text-sm text-muted-foreground md:col-span-2">
            {data.converted
              ? `The old number ${data.source.old_number} (${data.source.collection}) translates to new number ${data.target.new_number} (${data.target.collection}).`
              : `${data.source.old_number} is already a new-scheme number in ${data.target.collection}; no conversion required.`}
          </p>
        </div>
      )}
    </div>
  );
}