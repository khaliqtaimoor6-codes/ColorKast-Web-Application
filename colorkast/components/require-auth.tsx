"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { can, type Role } from "@/lib/permissions";
import { useCurrentUser } from "@/hooks/use-current-user";

export function RequireAuth({
  permission,
  children,
}: {
  permission?: string;
  children: React.ReactNode;
}) {
  const { user, loading } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (permission && !can(user.role as Role, permission)) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <Alert variant="destructive">
          <ShieldAlert className="size-4" />
          <AlertTitle>Access denied</AlertTitle>
          <AlertDescription>
            Your permission level ({user.role}) does not allow this action. Contact a Level 3
            administrator if you believe this is incorrect.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return children;
}