"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Role } from "@/lib/permissions";

export function TopBar({
  user,
}: {
  user: { username: string; role: Role } | null;
}) {
  const router = useRouter();

  async function handleSignOut() {
    const res = await fetch("/api/auth/logout", { method: "POST" });
    if (res.ok) {
      toast.success("Signed out");
      router.push("/");
      router.refresh();
    }
  }

  const initials = user ? user.username.slice(0, 2).toUpperCase() : "?";

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b bg-background/75 px-4 backdrop-blur-md">
      <SidebarTrigger className="-ml-1" />
      <div className="hidden h-2 flex-1 overflow-hidden rounded-sm sm:flex">
        <span className="h-full w-[18%] bg-[#2e5c8a]" />
        <span className="h-full w-[14%] bg-[#c45c32]" />
        <span className="h-full w-[16%] bg-[#3d6b4e]" />
        <span className="h-full w-[20%] bg-[#e2b84a]" />
        <span className="h-full w-[12%] bg-[#6b3a96]" />
        <span className="h-full w-[20%] bg-[#c8643c]" />
      </div>
      <div className="flex-1 sm:hidden" />
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 px-2">
              <Avatar className="size-7">
                <AvatarFallback className="bg-primary/10 text-xs text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm sm:inline">{user.username}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Signed in as {user.username}
            </DropdownMenuLabel>
            <DropdownMenuLabel className="-mt-2 text-sm font-medium">
              {user.role.replace("ADMIN_", "Administrator Level ")}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button variant="outline" size="sm" asChild>
          <a href="/login" className="gap-2">
            <LogOut className="size-4 rotate-180" />
            Sign in
          </a>
        </Button>
      )}
    </header>
  );
}