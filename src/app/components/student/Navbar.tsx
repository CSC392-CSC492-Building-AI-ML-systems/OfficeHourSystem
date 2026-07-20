"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ProfileMenu } from "@/app/components/shared/ProfileMenu";

const NAV_LINKS = [
  { label: "Dashboard", href: "/student" },
  { label: "My Queue", href: "/student/my-queue" },
];

type NavbarProps = {
  // Queue status is a global (cross-course) view; hide its link when this
  // navbar is rendered inside a specific course dashboard.
  showQueueLink?: boolean;
  /** Course-scoped label for the profile menu, e.g. "CSC108 · Term 20265". */
  courseLabel?: string;
};

export function Navbar({ showQueueLink = true, courseLabel }: NavbarProps) {
  const pathname = usePathname();
  const links = showQueueLink
    ? NAV_LINKS
    : NAV_LINKS.filter((l) => l.href !== "/student/my-queue");

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
            {links.map(({ label, href }) => {
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
          <ProfileMenu courseLabel={courseLabel} />
        </div>
      </div>
    </header>
  );
}
