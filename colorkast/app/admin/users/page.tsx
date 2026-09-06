"use client";

import { useCallback, useEffect, useState } from "react";
import { UserCog, Loader2, Plus, CheckCircle2 } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RequireAuth } from "@/components/require-auth";
import { useCurrentUser } from "@/hooks/use-current-user";
import { roleRank, type Role } from "@/lib/permissions";

interface AdminUser {
  id: number;
  username: string;
  role: Role;
}

const ROLE_OPTIONS: Role[] = ["ADMIN_L1", "ADMIN_L2", "ADMIN_L3"];

export default function ManageUsersPage() {
  const { user } = useCurrentUser();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("ADMIN_L1");
  const [errors, setErrors] = useState<string[]>([]);
  const [created, setCreated] = useState<AdminUser | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const maxCreatable = user ? roleRank(user.role as Role) : 0;
  const creatableRoles = ROLE_OPTIONS.filter((r) => roleRank(r) <= maxCreatable);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users", { cache: "no-store" });
      const body = (await res.json()) as { ok: boolean; data?: { users: AdminUser[] } };
      if (res.ok && body.ok) setUsers(body.data!.users);
    } catch {
      toast.error("Could not load administrative users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void loadUsers(), 0);
    return () => clearTimeout(t);
  }, [loadUsers]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (role && !creatableRoles.includes(role)) setRole("ADMIN_L1");
    }, 0);
    return () => clearTimeout(t);
  }, [creatableRoles, role]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);
    setCreated(null);

    const issues: string[] = [];
    if (!username.trim()) issues.push("Username is required.");
    if (password.length < 4) issues.push("Password must be at least 4 characters.");
    if (issues.length > 0) {
      setErrors(issues);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password, role }),
      });
      const body = (await res.json()) as { ok: boolean; error?: string; data?: AdminUser };
      if (!res.ok || !body.ok) {
        setErrors([body.error ?? "Could not create user."]);
        return;
      }
      setCreated(body.data!);
      setUsername("");
      setPassword("");
      toast.success(`Created user "${body.data!.username}"`);
      await loadUsers();
    } catch {
      setErrors(["Unexpected error while creating user."]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <RequireAuth permission="users:manage">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage Admin Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create administrative users. Per the SRS, you may create users at or below your own
            level.
          </p>
        </div>

        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertTitle>Could not create user</AlertTitle>
            <AlertDescription>
              <ul className="list-inside list-disc">
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {created && (
          <Alert>
            <CheckCircle2 className="size-4" />
            <AlertTitle>User created</AlertTitle>
            <AlertDescription>
              “{created.username}” was created with role {created.role}.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create administrative user</CardTitle>
            <CardDescription>Credentials shown here are for the prototype.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password (min 4 chars)</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                  <SelectTrigger id="role" className="w-full sm:max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {creatableRoles.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r.replace("ADMIN_", "Level ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                Create user
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Existing administrative users</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="flex items-center gap-2 font-medium">
                          <UserCog className="size-4 text-muted-foreground" />
                          {u.username}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{u.role.replace("ADMIN_", "Level ")}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RequireAuth>
  );
}