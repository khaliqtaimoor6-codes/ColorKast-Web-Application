import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TopBar } from "@/components/top-bar";
import { Toaster } from "@/components/ui/sonner";
import { getSessionUser } from "@/lib/auth";
import { seedIfEmpty } from "@/lib/seed";
import type { Role } from "@/lib/permissions";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ColorKast — ABC Paint",
    template: "%s · ColorKast",
  },
  description:
    "ColorKast helps ABC Paint customers and employees transition from the old paint-numbering scheme to the new scheme.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  seedIfEmpty();
  const user = await getSessionUser();
  const publicUser = user ? { username: user.username, role: user.role as Role } : null;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SidebarProvider>
          <AppSidebar user={publicUser} />
          <SidebarInset>
            <TopBar user={publicUser} />
            <main className="flex-1 p-4 md:p-6">{children}</main>
          </SidebarInset>
        </SidebarProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}