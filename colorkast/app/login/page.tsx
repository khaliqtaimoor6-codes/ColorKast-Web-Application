"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Droplets, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const body = (await res.json()) as { ok: boolean; error?: string; data?: { role: string } };
      if (!res.ok || !body.ok) {
        setError(body.error ?? "Sign in failed.");
        return;
      }
      toast.success(`Signed in as ${username}`);
      const isAdmin = body.data!.role.startsWith("ADMIN_");
      router.push(isAdmin ? "/admin" : "/");
      router.refresh();
    } catch {
      setError("Unexpected error during sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col justify-center py-8 md:py-16">
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow">
          <Droplets className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sign in to ColorKast</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Administrative access is restricted to authorized ABC Paint staff.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Administrator sign in</CardTitle>
          <CardDescription>Use your staff credentials to access the Administration area.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            {error && (
              <Alert variant="destructive">
                <ShieldAlert className="size-4" />
                <AlertTitle>Sign in failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Sign in
            </Button>
          </form>

          <Separator className="my-5" />
          <div className="grid gap-1.5 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Prototype credentials</p>
            <p>
              user1 / user1 — default user &nbsp;·&nbsp; admin1 / admin1 — Level 1 &nbsp;·&nbsp;
              admin2 / admin2 — Level 2 &nbsp;·&nbsp; admin3 / admin3 — Level 3
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}