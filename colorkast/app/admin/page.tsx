"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import { Plus, PencilLine, Trash2, UserCog, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RequireAuth } from "@/components/require-auth";
import { useCurrentUser } from "@/hooks/use-current-user";
import { can, type Role } from "@/lib/permissions";

const ROLE_LABEL: Record<string, string> = {
  USER: "Basic user — no administrative functions",
  ADMIN_L1: "Level 1 — can add paint information",
  ADMIN_L2: "Level 2 — can add and update paint information",
  ADMIN_L3: "Level 3 — full administrative access",
};

export default function AdminPage() {
  const { user } = useCurrentUser();
  const role = (user?.role ?? "USER") as Role;

  const card = (href: string, Icon: ComponentType<{ className?: string }>, title: string, desc: string, available: boolean) => (
    <Card className={`p-5 ${available ? "transition-shadow hover:shadow-md" : "opacity-50"}`}>
      <div className="flex items-start gap-4">
        <div className={`flex size-10 shrink-0 items-center justify-center ${available ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
          {available ? (
            <Button asChild variant="ghost" size="sm" className="mt-3 gap-1 px-0">
              <Link href={href}>Open</Link>
            </Button>
          ) : (
            <p className="mt-3 text-xs font-medium text-muted-foreground">Not available at your level</p>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <RequireAuth>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div>
          <h1 className="text-3xl">Administration</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4" />
            Managing paint information as {user?.username}
            <Badge variant="secondary">{role.replace("ADMIN_", "Level ")}</Badge>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{ROLE_LABEL[role] ?? ROLE_LABEL.USER}</p>
        </div>

        <Separator />
        <p className="text-sm font-medium text-muted-foreground">Available functions</p>

        <div className="grid gap-4 sm:grid-cols-2">
          {card("/admin/add", Plus, "Add Paint", "Create a new paint record with validation.", can(role, "paint:add"))}
          {card("/admin/update", PencilLine, "Update Paint", "Edit an existing paint record.", can(role, "paint:update"))}
          {card("/admin/delete", Trash2, "Delete Paint", "Remove a paint record (with confirmation).", can(role, "paint:delete"))}
          {card("/admin/users", UserCog, "Manage Admin Users", "Create administrative users at or below your level.", can(role, "users:manage"))}
        </div>
      </div>
    </RequireAuth>
  );
}