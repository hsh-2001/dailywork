"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChartNoAxesCombined,
  ClipboardList,
  LayoutDashboard,
  Settings,
  StickyNote,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Work logs", href: "/ot-record", icon: ClipboardList },
  { label: "Notes", href: "/notes", icon: StickyNote },
  { label: "Reports", href: "/reports", icon: ChartNoAxesCombined },
  { label: "Settings", href: "/settings", icon: Settings },
];

const isRouteActive = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const activeQuickIndex = Math.max(
    0,
    navigation.findIndex(({ href }) => isRouteActive(pathname, href)),
  );

  useEffect(() => {
    const viewport = window.visualViewport;
    let focusTimeout: ReturnType<typeof setTimeout> | undefined;

    const updateKeyboardState = () => {
      const activeElement = document.activeElement;
      const editableField =
        ((activeElement instanceof HTMLInputElement ||
          activeElement instanceof HTMLTextAreaElement ||
          activeElement instanceof HTMLSelectElement) &&
          !activeElement.disabled) ||
        (activeElement instanceof HTMLElement &&
          (activeElement.isContentEditable ||
            activeElement.getAttribute("role") === "textbox"));
      const viewportResized =
        viewport !== null && window.innerHeight - viewport.height > 120;

      setKeyboardOpen(viewportResized || editableField);
    };

    const handleFocusIn = () => {
      if (focusTimeout) clearTimeout(focusTimeout);
      updateKeyboardState();
    };
    const handleViewportChange = () => updateKeyboardState();
    const handleFocusOut = () => {
      if (focusTimeout) clearTimeout(focusTimeout);
      focusTimeout = setTimeout(updateKeyboardState, 250);
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);
    window.addEventListener("resize", handleViewportChange);
    viewport?.addEventListener("resize", handleViewportChange);
    viewport?.addEventListener("scroll", handleViewportChange);

    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
      window.removeEventListener("resize", handleViewportChange);
      viewport?.removeEventListener("resize", handleViewportChange);
      viewport?.removeEventListener("scroll", handleViewportChange);
      if (focusTimeout) clearTimeout(focusTimeout);
    };
  }, []);

  return (
    <div className={`min-h-screen ${keyboardOpen ? "pb-0" : "pb-24"} lg:pb-0`}>
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 pt-[env(safe-area-inset-top)] shadow-[0_2px_12px_rgba(15,23,42,0.025)] backdrop-blur-2xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="group flex min-w-0 items-center gap-2.5 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 sm:gap-3"
          >
            <Image
              src="/daily-work-icon.png"
              alt=""
              width={40}
              height={40}
              className="size-8 rounded-lg object-cover shadow-sm ring-1 ring-slate-900/5 transition-transform group-hover:scale-[1.03] sm:size-9 sm:rounded-xl"
              priority
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold leading-tight tracking-tight text-slate-900 sm:text-[0.95rem]">
                Daily Work
              </span>
              <span className="mt-0.5 hidden text-[11px] leading-tight text-slate-500 sm:block">
                Your work, organized
              </span>
            </span>
          </Link>

          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-0.5 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-1 lg:flex"
          >
            {navigation.map(({ label, href, icon: Icon }) => {
              const active = isRouteActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex h-8 items-center gap-2 rounded-lg px-2.5 text-[13px] font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 lg:px-3 ${
                    active
                      ? "bg-white text-blue-700 shadow-sm ring-1 ring-slate-200/70"
                      : "text-slate-600 hover:bg-white/80 hover:text-slate-950"
                  }`}
                >
                  <Icon
                    size={16}
                    strokeWidth={active ? 2.2 : 1.8}
                    aria-hidden="true"
                  />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <div key={pathname} className="page-transition">
        {children}
      </div>

      <nav
        aria-label="Quick navigation"
        aria-hidden={keyboardOpen}
        className={`${keyboardOpen ? "hidden" : "fixed inset-x-0 bottom-0 z-20 px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.2rem)]"} lg:hidden`}
      >
        <ul className="relative mx-auto grid max-w-xl grid-cols-5 rounded-full border border-slate-200/80 bg-white/90 p-1 shadow-[0_8px_24px_rgba(15,23,42,0.14)] backdrop-blur-2xl">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-1 left-1 top-1 z-0 rounded-full border border-white/90 bg-white/55 shadow-[0_4px_14px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-xl transition-transform duration-300 ease-out motion-reduce:transition-none"
            style={{
              width: "calc((100% - 0.5rem) / 5)",
              transform: `translateX(${activeQuickIndex * 100}%)`,
            }}
          />
          {navigation.map(({ label, href, icon: Icon }) => {
            const active = isRouteActive(pathname, href);
            return (
              <li key={href} className="relative z-10">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  aria-label={label}
                  aria-disabled={active || undefined}
                  tabIndex={active ? -1 : undefined}
                  onClick={(event) => {
                    if (active) event.preventDefault();
                  }}
                  className={`relative z-10 flex min-h-11 flex-col items-center justify-center gap-0 rounded-full border border-transparent px-1 text-center transition-transform duration-200 motion-reduce:transition-none ${active ? "cursor-default" : "hover:bg-slate-100/70 active:scale-95 motion-reduce:active:scale-100"}`}
                  style={{ color: active ? "#334155" : "#64748b" }}
                >
                  <span className="flex size-6 items-center justify-center">
                    <Icon size={18} strokeWidth={active ? 2 : 1.8} aria-hidden="true" />
                  </span>
                  <span className={`text-[9px] leading-none max-[359px]:hidden ${active ? "font-semibold" : "font-medium"}`}>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
