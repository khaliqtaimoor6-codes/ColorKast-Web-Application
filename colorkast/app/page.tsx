import Link from "next/link";
import {
  ArrowRight,
  ArrowRightLeft,
  Search,
  Target,
  Palette,
  Shield,
  Droplets,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    href: "/search",
    title: "Color Search",
    description: "Locate colors by paint name, number, or RGB value across any collection.",
    icon: Search,
    accent: "from-sky-500 to-blue-600",
  },
  {
    href: "/translator",
    title: "Color Number Translator",
    description: "Translate old-scheme paint numbers into the new numbering scheme.",
    icon: ArrowRightLeft,
    accent: "from-violet-500 to-purple-600",
  },
  {
    href: "/closest",
    title: "Closest Colors",
    description: "Find the nearest matching colors to any target color within a collection.",
    icon: Target,
    accent: "from-rose-500 to-red-600",
  },
  {
    href: "/palette",
    title: "My Color Palette",
    description: "Keep your recent color searches handy across your current session.",
    icon: Palette,
    accent: "from-emerald-500 to-green-600",
  },
  {
    href: "/admin",
    title: "Administration",
    description: "Manage paint information and administrative users by permission level.",
    icon: Shield,
    accent: "from-amber-500 to-orange-600",
    adminPath: true,
  },
];

const SWATCHES = [
  { r: 30, g: 90, b: 180 },
  { r: 200, g: 50, b: 60 },
  { r: 34, g: 139, b: 34 },
  { r: 255, g: 200, b: 0 },
  { r: 100, g: 40, b: 150 },
  { r: 200, g: 100, b: 60 },
];

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary via-primary to-primary/80 p-8 text-primary-foreground md:p-12">
        <div className="absolute -right-10 -top-10 size-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-16 right-24 size-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-4">
          <Badge className="w-fit bg-white/15 text-primary-foreground hover:bg-white/20">
            <Droplets className="mr-1 size-3" />
            ABC Paint · New numbering scheme
          </Badge>
          <h1 className="max-w-xl text-3xl font-bold tracking-tight md:text-5xl">
            Welcome to <span className="text-amber-300">ColorKast</span>
          </h1>
          <p className="max-w-xl text-pretty text-primary-foreground/80 md:text-lg">
            The easy way to transition from the old paint-numbering scheme to the new one.
            Search, translate, and compare colors across all ABC Paint collections.
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Button asChild size="lg" className="gap-2 bg-white text-foreground hover:bg-white/90">
              <Link href="/search">
                <Search className="size-4" />
                Search colors
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="gap-2 border-white/30 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
            >
              <Link href="/translator">
                <ArrowRightLeft className="size-4" />
                Translate a number
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <Card key={f.title} className="group overflow-hidden transition-shadow hover:shadow-md">
            <CardHeader>
              <div className={`mb-2 flex size-10 items-center justify-center rounded-xl bg-gradient-to-br ${f.accent} text-white shadow`}>
                <f.icon className="size-5" />
              </div>
              <CardTitle className="text-base">{f.title}</CardTitle>
              <CardDescription>{f.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button asChild variant="ghost" size="sm" className="gap-1 px-0 text-primary">
                <Link href={f.href}>
                  Open
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}

        <Card className="flex flex-col justify-between bg-muted/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-primary" />
              A palette of choices
            </CardTitle>
            <CardDescription>
              Sample previews from the Premium, Classic, and Economy collections.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {SWATCHES.map((s) => (
              <div
                key={`${s.r}-${s.g}-${s.b}`}
                className="size-10 rounded-lg border shadow-sm"
                style={{ backgroundColor: `rgb(${s.r}, ${s.g}, ${s.b})` }}
              />
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}