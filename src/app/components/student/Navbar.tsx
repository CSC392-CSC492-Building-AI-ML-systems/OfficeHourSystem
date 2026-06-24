"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, UserCircle } from "lucide-react";

const NAV_LINKS = [
  { label: "Dashboard", href: "/student" },
  { label: "My Queue", href: "/student/my-queue" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="rounded-[28px] border border-slate-200/80 bg-white px-5 py-4 shadow-[0_16px_40px_-32px_rgba(15,41,66,0.35)] sm:px-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-10">
          <Link
            href="/"
            className="text-2xl font-black tracking-[0.22em] text-[#071f41]"
          >
            OHMS
          </Link>

          <nav className="flex items-center gap-6 text-sm font-medium text-slate-500">
            {NAV_LINKS.map(({ label, href }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative pb-3 transition ${
                    active ? "text-[#071f41]" : "hover:text-[#071f41]"
                  }`}
                >
                  {label}
                  {active && (
                    <span className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-[#c8102e]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <button
            type="button"
            aria-label="Notifications"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-[#071f41]"
          >
            <Bell className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Profile"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#071f41] text-white shadow-sm transition hover:bg-[#0f2942]"
          >
            <UserCircle className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
