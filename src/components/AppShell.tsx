"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MapPinned, Radar, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

const NAV: { href: string; label: string; short: string; icon: LucideIcon }[] = [
  { href: "/report", label: "Report a hazard", short: "Report", icon: MapPinned },
  { href: "/dashboard", label: "Authority dashboard", short: "Dashboard", icon: LayoutDashboard },
  { href: "/monitor", label: "Hazard monitor", short: "Monitor", icon: Radar },
];

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="hidden border-r border-line bg-civic-dark text-white lg:block">
        <div className="sticky top-0 flex h-screen flex-col p-5">
          <div className="mb-8">
            <p className="text-lg font-semibold leading-tight">Hazard Watch</p>
            <p className="mt-1 text-xs text-white/70">Crowdsourced sustainability mapping</p>
          </div>
          <nav aria-label="Main" className="flex flex-col gap-1">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} aria-current={path === href ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${path === href ? "bg-white/15 font-medium" : "text-white/75 hover:bg-white/10"}`}>
                <Icon size={18} /> {label}
              </Link>
            ))}
          </nav>
          <p className="mt-auto text-xs text-white/50">Community Engagement Project prototype</p>
        </div>
      </aside>
      <header className="flex items-center justify-between border-b border-line bg-civic-dark px-4 py-3 text-white lg:hidden">
        <span className="font-semibold">Hazard Watch</span>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-10 lg:pt-8">{children}</main>
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-line bg-white lg:hidden">
        {NAV.map(({ href, short, icon: Icon }) => (
          <Link key={href} href={href} aria-current={path === href ? "page" : undefined}
            className={`flex flex-col items-center gap-1 py-2.5 text-xs ${path === href ? "font-semibold text-civic" : "text-slate-500"}`}>
            <Icon size={20} /> {short}
          </Link>
        ))}
      </nav>
    </div>
  );
}
