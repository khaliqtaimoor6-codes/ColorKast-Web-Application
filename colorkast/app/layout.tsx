import type { Metadata } from "next";
import { Fraunces, Source_Sans_3, IBM_Plex_Mono } from "next/font/google";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TopBar } from "@/components/top-bar";
import { Toaster } from "@/components/ui/sonner";
import { getSessionUser } from "@/lib/auth";
import { seedIfEmpty } from "@/lib/seed";
import type { Role } from "@/lib/permissions";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-ibm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
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
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SidebarProvider>
          <AppSidebar user={publicUser} />
          <SidebarInset>
            <TopBar user={publicUser} />
            <main className="flex-1 p-4 md:p-8">{children}</main>
          </SidebarInset>
        </SidebarProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}