"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  ArrowRightLeft,
  Target,
  Palette,
  Shield,
  LogIn,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Role } from "@/lib/permissions";

interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  authOnly?: boolean;
  guestOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Color Search", icon: Search },
  { href: "/translator", label: "Color Translator", icon: ArrowRightLeft },
  { href: "/closest", label: "Closest Colors", icon: Target },
  { href: "/palette", label: "My Palette", icon: Palette },
  { href: "/admin", label: "Administration", icon: Shield, adminOnly: true },
  { href: "/login", label: "Sign In", icon: LogIn, guestOnly: true },
];

function isAdminRole(role: Role | null): boolean {
  return role === "ADMIN_L1" || role === "ADMIN_L2" || role === "ADMIN_L3";
}

export function AppSidebar({ user }: { user: { username: string; role: Role } | null }) {
  const pathname = usePathname();
  const isAdmin = isAdminRole(user?.role ?? null);

  const visible = NAV_ITEMS.filter((item) => {
    if (item.adminOnly) return isAdmin;
    if (item.authOnly) return !!user;
    if (item.guestOnly) return !user;
    return true;
  });

  return (
    <TooltipProvider delayDuration={0}>
      <Sidebar>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/" className="gap-2.5">
                  <div className="flex size-8 overflow-hidden border border-sidebar-border">
                    <span className="h-full w-1/3 bg-[#c45c32]" />
                    <span className="h-full w-1/3 bg-[#e2b84a]" />
                    <span className="h-full w-1/3 bg-[#3d6b4e]" />
                  </div>
                  <div className="grid leading-tight">
                    <span className="font-heading text-base tracking-tight">ColorKast</span>
                    <span className="text-[11px] tracking-wide text-sidebar-foreground/60">
                      ABC Paint
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarSeparator />
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu>
            {visible.map((item) => {
              const active = pathname === item.href;
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                    <Link href={item.href} className="gap-2">
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="sm" disabled>
                <span className="text-[11px] text-sidebar-foreground/55">
                  {user ? `Signed in as ${user.username} (${user.role})` : "Signed out"}
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}