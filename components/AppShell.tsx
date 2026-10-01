"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ChartNoAxesCombined,
  ClipboardList,
  LayoutDashboard,
  Menu,
  Settings,
  X,
  FolderKanban,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Work logs", href: "/ot-record", icon: ClipboardList },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Reports", href: "/reports", icon: ChartNoAxesCombined },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const activeQuickIndex = Math.max(
    0,
    navigation.findIndex(({ href }) => pathname === href || pathname.startsWith(`${href}/`)),
  );

  return (
    <div className="min-h-screen pb-24 sm:pb-0">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between px-4 sm:h-[4.75rem] sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600">
            <Image
              src="/daily-work-icon.png"
              alt=""
              width={40}
              height={40}
              className="size-10 rounded-[0.9rem] object-cover shadow-sm"
              priority
            />
            <span>
              <span className="block text-sm font-bold leading-tight text-slate-900">Daily Work</span>
              <span className="hidden text-xs text-slate-500 sm:block">Your work, organized</span>
            </span>
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-1 md:flex">
            {navigation.map(({ label, href, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors ${
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon size={17} strokeWidth={active ? 2.2 : 1.9} aria-hidden="true" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-main-navigation"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            className="flex size-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 md:hidden"
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>

        {menuOpen && (
          <>
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 top-[4.25rem] z-30 bg-slate-950/20 md:hidden"
            />
            <nav
              id="mobile-main-navigation"
              aria-label="Main navigation"
              className="absolute inset-x-0 top-full z-40 border-b border-slate-200 bg-white px-4 py-3 shadow-xl md:hidden"
            >
              <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Workspace
              </p>
              <ul className="space-y-1">
                {navigation.map(({ label, href, icon: Icon }) => {
                  const active = pathname === href || pathname.startsWith(`${href}/`);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        aria-current={active ? "page" : undefined}
                        onClick={() => setMenuOpen(false)}
                        className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors ${
                          active
                            ? "bg-blue-50 text-blue-700"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <Icon size={19} aria-hidden="true" />
                        {label}
                        {active && <span className="ml-auto text-xs font-medium text-blue-500">Current</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </>
        )}
      </header>

      {children}

      <nav
        aria-label="Quick navigation"
        className="fixed inset-x-0 bottom-0 z-20 px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+1rem)] md:hidden"
      >
        <ul className="relative mx-auto grid max-w-xl grid-cols-5 rounded-full border border-white/30 bg-[linear-gradient(105deg,#1d4ed8_0%,#2563eb_58%,#0875e1_100%)] p-1 shadow-[0_6px_20px_rgba(37,99,235,0.22),inset_0_1px_0_rgba(255,255,255,0.24)] backdrop-blur-2xl">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-1 left-1 top-1 z-0 rounded-full border border-white/35 bg-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] backdrop-blur-xl transition-transform duration-300 ease-out motion-reduce:transition-none"
            style={{
              width: "calc((100% - 0.5rem) / 5)",
              transform: `translateX(${activeQuickIndex * 100}%)`,
            }}
          />
          {navigation.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className="relative z-10 flex min-h-[2.75rem] flex-col items-center justify-center gap-0 rounded-full border border-transparent px-1 text-center transition-transform duration-200 hover:bg-white/10 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100"
                  style={{ color: "#ffffff" }}
                >
                  <span className="flex size-6 items-center justify-center">
                    <Icon size={18} strokeWidth={active ? 2 : 1.8} aria-hidden="true" />
                  </span>
                  <span className={`text-[10px] leading-none ${active ? "font-semibold" : "font-medium"}`}>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
