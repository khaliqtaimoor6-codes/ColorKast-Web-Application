import Link from "next/link";
import {
  ArrowRight,
  ArrowRightLeft,
  Search,
  Target,
  Palette,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    href: "/search",
    title: "Color Search",
    description: "Locate colors by paint name, number, or RGB value across any collection.",
    icon: Search,
    chip: "rgb(46, 92, 138)",
  },
  {
    href: "/translator",
    title: "Color Number Translator",
    description: "Translate old-scheme paint numbers into the new numbering scheme.",
    icon: ArrowRightLeft,
    chip: "rgb(154, 74, 42)",
  },
  {
    href: "/closest",
    title: "Closest Colors",
    description: "Find the nearest matching colors to any target color within a collection.",
    icon: Target,
    chip: "rgb(61, 107, 78)",
  },
  {
    href: "/palette",
    title: "My Color Palette",
    description: "Keep your recent color searches handy across your current session.",
    icon: Palette,
    chip: "rgb(184, 132, 48)",
  },
  {
    href: "/admin",
    title: "Administration",
    description: "Manage paint information and administrative users by permission level.",
    icon: Shield,
    chip: "rgb(92, 58, 46)",
    adminPath: true,
  },
];

const SWATCHES = [
  { r: 30, g: 90, b: 180, name: "Harbor" },
  { r: 200, g: 50, b: 60, name: "Brick" },
  { r: 34, g: 139, b: 34, name: "Grove" },
  { r: 255, g: 200, b: 0, name: "Marigold" },
  { r: 100, g: 40, b: 150, name: "Plum" },
  { r: 200, g: 100, b: 60, name: "Clay" },
];

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10">
      <section className="overflow-hidden rounded-md border bg-card">
        <div className="flex h-3">
          {SWATCHES.map((s) => (
            <div
              key={`${s.r}-${s.g}-${s.b}`}
              className="h-full flex-1"
              style={{ backgroundColor: `rgb(${s.r}, ${s.g}, ${s.b})` }}
            />
          ))}
        </div>
        <div className="grid gap-8 p-7 md:grid-cols-[1.3fr_0.7fr] md:p-10">
          <div className="flex flex-col gap-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              ABC Paint · numbering house
            </p>
            <h1 className="max-w-lg text-4xl leading-[1.05] md:text-6xl">
              ColorKast
            </h1>
            <p className="max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
              The easy way to move from the old paint-numbering scheme to the new one.
              Search, translate, and compare colors across every ABC Paint collection.
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              <Button asChild size="lg" className="gap-2 px-4">
                <Link href="/search">
                  <Search className="size-4" />
                  Search colors
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2 px-4">
                <Link href="/translator">
                  <ArrowRightLeft className="size-4" />
                  Translate a number
                </Link>
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 self-end">
            {SWATCHES.map((s) => (
              <div key={s.name} className="overflow-hidden rounded-sm border bg-background">
                <div
                  className="paint-chip h-16 w-full"
                  style={{ backgroundColor: `rgb(${s.r}, ${s.g}, ${s.b})` }}
                />
                <p className="px-2 py-1.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  {s.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <Card key={f.title} className="group overflow-hidden rounded-md py-0 transition-transform hover:-translate-y-0.5">
            <div className="h-1.5 w-full" style={{ backgroundColor: f.chip }} />
            <CardHeader className="pt-5">
              <div
                className="mb-2 flex size-9 items-center justify-center text-white"
                style={{ backgroundColor: f.chip }}
              >
                <f.icon className="size-4" />
              </div>
              <CardTitle className="text-lg">{f.title}</CardTitle>
              <CardDescription className="leading-relaxed">{f.description}</CardDescription>
            </CardHeader>
            <CardContent className="pb-5 pt-0">
              <Button asChild variant="ghost" size="sm" className="gap-1 px-0 text-primary">
                <Link href={f.href}>
                  Open
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
