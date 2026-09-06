"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, CheckCircle2 } from "lucide-react";
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
import { RequireAuth } from "@/components/require-auth";
import { COLLECTIONS } from "@/lib/permissions";

interface Field {
  key: string;
  label: string;
  type?: string;
  placeholder?: string;
}

const TEXT_FIELDS: Field[] = [
  { key: "paint_name", label: "Paint name", placeholder: "e.g. Ocean Blue" },
  { key: "old_number", label: "Old paint number", placeholder: "e.g. A101" },
  { key: "new_number", label: "New paint number", placeholder: "e.g. B205" },
];

const RGB_FIELDS = [
  { key: "r", label: "Red (0–255)" },
  { key: "g", label: "Green (0–255)" },
  { key: "b", label: "Blue (0–255)" },
] as const satisfies ReadonlyArray<{ key: "r" | "g" | "b"; label: string }>;

export default function AddPaintPage() {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string>>({});
  const [collection, setCollection] = useState<string>("");
  const [rgb, setRgb] = useState({ r: "", g: "", b: "" });
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{ id: number; paint_name: string } | null>(null);

  function setField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);
    setCreated(null);

    const r = Number(rgb.r);
    const g = Number(rgb.g);
    const b = Number(rgb.b);
    const issues: string[] = [];
    if (!form.paint_name?.trim()) issues.push("Paint name is required.");
    if (!form.old_number?.trim()) issues.push("Old paint number is required.");
    if (!form.new_number?.trim()) issues.push("New paint number is required.");
    if (!collection) issues.push("Collection is required.");
    if (!Number.isInteger(r) || r < 0 || r > 255) issues.push("Red value must be an integer 0–255.");
    if (!Number.isInteger(g) || g < 0 || g > 255) issues.push("Green value must be an integer 0–255.");
    if (!Number.isInteger(b) || b < 0 || b > 255) issues.push("Blue value must be an integer 0–255.");

    if (issues.length > 0) {
      setErrors(issues);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/paints", {
        method: "POST",
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
      const body = (await res.json()) as { ok: boolean; error?: string; data?: { id: number; paint_name: string } };
      if (!res.ok || !body.ok) {
        setErrors([body.error ?? "Could not add paint."]);
        return;
      }
      setCreated({ id: body.data!.id, paint_name: body.data!.paint_name });
      toast.success(`Added "${body.data!.paint_name}"`);
      router.refresh();
    } catch {
      setErrors(["Unexpected error while adding paint."]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <RequireAuth permission="paint:add">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Paint</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a new paint record. All fields are validated before saving.
          </p>
        </div>

        {created && (
          <Alert>
            <CheckCircle2 className="size-4" />
            <AlertTitle>Paint added</AlertTitle>
            <AlertDescription>
              “{created.paint_name}” (id {created.id}) was added successfully and is now searchable.
            </AlertDescription>
          </Alert>
        )}

        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertTitle>Could not add paint</AlertTitle>
            <AlertDescription>
              <ul className="list-inside list-disc">
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Paint details</CardTitle>
            <CardDescription>Enter the new paint information.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4">
              {TEXT_FIELDS.map((f) => (
                <div className="grid gap-2" key={f.key}>
                  <Label htmlFor={f.key}>{f.label}</Label>
                  <Input
                    id={f.key}
                    placeholder={f.placeholder}
                    value={form[f.key] ?? ""}
                    onChange={(e) => setField(f.key, e.target.value)}
                    className="w-full"
                  />
                </div>
              ))}

              <div className="grid gap-2">
                <Label htmlFor="collection">Collection</Label>
                <Select value={collection} onValueChange={setCollection}>
                  <SelectTrigger id="collection" className="w-full">
                    <SelectValue placeholder="Select a collection" />
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
                    <Label htmlFor={f.key}>{f.label}</Label>
                    <Input
                      id={f.key}
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

              <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                Add paint
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </RequireAuth>
  );
}