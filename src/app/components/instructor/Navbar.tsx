"use client";

import Link from "next/link";
import { Search } from "lucide-react";

import { ProfileMenu } from "@/app/components/shared/ProfileMenu";
import { courseRouteHref } from "@/lib/offeringUrls";

// Course Stats is intentionally NOT here: it is entered from the admin page,
// not from a course workspace navbar.
export type InstructorNavItem = "dashboard" | "queues" | "schedule";

interface NavbarProps {
  activeItem?: InstructorNavItem;
  showSearch?: boolean;
  offeringPublicId?: string;
  /** Course-scoped label for the profile menu, e.g. "CSC108 · Term 20265". */
  courseLabel?: string;
}

const navPaths: Array<{
  key: InstructorNavItem;
  label: string;
  path: string;
}> = [
  { key: "dashboard", label: "Dashboard", path: "/instructor" },
  { key: "queues", label: "My Queues", path: "/instructor/my-queues" },
  { key: "schedule", label: "Schedule", path: "/instructor/schedule" },
];

// No default for activeItem: pages outside the course nav (e.g. Course Stats)
// render the bar with nothing highlighted.
export function Navbar({
  activeItem,
  showSearch = false,
  offeringPublicId,
  courseLabel,
}: NavbarProps) {
  const visibleLinks = navPaths;

  return (
    <header className="rounded-[28px] border border-slate-200/80 bg-white px-5 py-4 shadow-[0_16px_40px_-32px_rgba(15,41,66,0.35)] sm:px-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-10">
          <Link
            href="/admin"
            className="text-2xl font-black tracking-[0.22em] text-[#071f41]"
          >
            HourSpace
          </Link>

          <nav className="flex flex-wrap items-center gap-6 text-sm font-medium">
            {visibleLinks.map((link) => {
              const isActive = link.key === activeItem;
              // Links are course-scoped when we have an offering in context.
              const href = !offeringPublicId
                ? link.path
                : courseRouteHref(link.path, offeringPublicId);

              return (
                <Link
                  key={link.key}
                  href={href}
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

          <div className="flex items-center gap-3">
            <ProfileMenu courseLabel={courseLabel} />
          </div>
        </div>
      </div>
    </header>
  );
}
