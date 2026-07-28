"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { ProfileMenu } from "@/app/components/shared/ProfileMenu";

export type AppNavItem = {
  key: string;
  label: string;
  href: string;
};

type NavbarProps = {
  /** Nav links on the left (next to the brand); omit or pass [] for none. */
  items?: AppNavItem[];
  /** Nav links on the right (before profile); omit or pass [] for none. */
  endItems?: AppNavItem[];
  /** Highlight matching item.key; omit to highlight none. */
  activeKey?: string;
  brandHref?: string;
  /** Course-scoped label for the profile menu, e.g. "CSC108 · Term 20265". */
  courseLabel?: string;
  showSearch?: boolean;
  /** Replaces the default ProfileMenu when provided. */
  trailing?: ReactNode;
};

function NavLinks({
  items,
  activeKey,
}: {
  items: AppNavItem[];
  activeKey?: string;
}) {
  if (items.length === 0) return null;

  return (
    <nav className="flex flex-wrap items-center gap-6 text-sm font-medium">
      {items.map((link) => {
        const isActive = link.key === activeKey;
        return (
          <Link
            key={link.key}
            href={link.href}
            className={`relative pb-3 transition ${
              isActive
                ? "text-[#071f41]"
                : "text-slate-500 hover:text-[#071f41]"
            }`}
          >
            {link.label}
            {isActive ? (
              <span className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-[#c8102e]" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function Navbar({
  items = [],
  endItems = [],
  activeKey,
  brandHref = "/",
  courseLabel,
  showSearch = false,
  trailing,
}: NavbarProps) {
  return (
    <header className="rounded-[28px] border-2 border-[#c8102e] bg-white px-5 py-4 shadow-[0_16px_40px_-32px_rgba(15,41,66,0.35)] sm:px-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-10">
          <Link
            href={brandHref}
            className="text-2xl font-black tracking-[0.22em] text-[#071f41]"
          >
            HourSpace
          </Link>

          <NavLinks items={items} activeKey={activeKey} />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:self-end xl:self-auto">
          {showSearch ? (
            <label className="relative block min-w-0 sm:w-64">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search sessions..."
                className="w-full rounded-full border border-slate-200 bg-[#f8fafc] py-2.5 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#071f41]"
              />
            </label>
          ) : null}

          <div className="flex items-center gap-6">
            <NavLinks items={endItems} activeKey={activeKey} />
            {trailing ?? <ProfileMenu courseLabel={courseLabel} />}
          </div>
        </div>
      </div>
    </header>
  );
}
