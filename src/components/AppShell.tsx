"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MapPinned, Radar, type LucideIcon } from "lucide-react";
import { LogoMark } from "./Logo";
import type { ReactNode } from "react";

const NAV: { href: string; label: string; short: string; icon: LucideIcon }[] = [
  { href: "/report", label: "Report a hazard", short: "Report", icon: MapPinned },
  { href: "/dashboard", label: "Authority dashboard", short: "Dashboard", icon: LayoutDashboard },
  { href: "/monitor", label: "Live demo: detection", short: "Demo", icon: Radar },
];

function Brand() {
  return (
    <Link href="/report" className="flex items-center gap-3">
            <LogoMark className="h-10 w-10 shrink-0" />
      <span className="font-display text-xl font-bold leading-none tracking-tight">Hazard Watch</span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="on-dark hidden bg-civic-dark text-white lg:block">
        <div className="sticky top-0 flex h-screen flex-col">
          <div className="hazard-stripe h-1.5" aria-hidden />
          <div className="flex flex-1 flex-col p-5">
            <div className="mb-10 mt-2">
              <Brand />
              <p className="mt-3 text-sm text-white/70">Report it. Five neighbours make it official.</p>
            </div>
            <nav aria-label="Main" className="flex flex-col gap-1">
              {NAV.map(({ href, label, icon: Icon }) => {
                const active = path === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-r-lg border-l-4 px-3 py-2.5 text-sm ${
                      active ? "border-signal bg-white/10 font-semibold" : "border-transparent text-white/75 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon size={18} aria-hidden /> {label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-auto border-t border-white/10 pt-4 text-xs text-white/60">
              <p className="font-medium text-white/80">Pune pilot</p>
              <p>Community Engagement Project prototype</p>
            </div>
          </div>
        </div>
      </aside>

      <header className="on-dark bg-civic-dark text-white lg:hidden">
        <div className="hazard-stripe h-1" aria-hidden />
        <div className="px-4 py-3"><Brand /></div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-10 lg:pt-8">{children}</main>

      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-line bg-white lg:hidden">
        {NAV.map(({ href, short, icon: Icon }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-1 border-t-[3px] py-2.5 text-xs ${
                active ? "border-signal font-semibold text-civic" : "border-transparent text-slate-500"
              }`}
            >
              <Icon size={20} aria-hidden /> {short}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}