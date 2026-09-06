"use client";

import { useCallback, useEffect, useState } from "react";
import type { Role } from "@/lib/permissions";

export interface CurrentUser {
  id: number;
  username: string;
  role: Role;
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const body = (await res.json()) as { ok: boolean; data: CurrentUser | null };
      setUser(body.ok ? body.data : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(t);
  }, [refresh]);

  return { user, loading, refresh };
}