"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { ADMIN_NAV_ITEM } from "@/app/components/course/courseNav";
import {
  Navbar as AppNavbar,
  type AppNavItem,
} from "@/app/components/shared/Navbar";

const STUDENT_NAV: AppNavItem[] = [
  { key: "courses", label: "Courses", href: "/course" },
  {
    key: "interested",
    label: "My Interested Office Hours",
    href: "/course/my-interested-office-hours",
  },
  { key: "queue", label: "My Queue", href: "/course/my-queue" },
];

type NavbarProps = {
  // Queue status is a global (cross-course) view; hide its link when this
  // navbar is rendered inside a specific course dashboard.
  showQueueLink?: boolean;
  /** Course-scoped label for the profile menu, e.g. "CSC108 · Term 20265". */
  courseLabel?: string;
};

/** Student workspace nav preset over the shared modular Navbar. */
export function Navbar({ showQueueLink = true, courseLabel }: NavbarProps) {
  const pathname = usePathname();
  const [endItems, setEndItems] = useState<AppNavItem[]>([]);
  const items = showQueueLink
    ? STUDENT_NAV
    : STUDENT_NAV.filter((item) => item.key !== "queue");
  const activeKey = items.find((item) => item.href === pathname)?.key;

  useEffect(() => {
    let cancelled = false;

    async function loadAdminNav() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { isAdmin?: boolean };
        if (!cancelled && data.isAdmin) {
          setEndItems([ADMIN_NAV_ITEM]);
        }
      } catch {
        // Profile menu handles its own load errors; nav extras are optional.
      }
    }

    void loadAdminNav();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppNavbar
      items={items}
      endItems={endItems}
      activeKey={activeKey}
      brandHref="/course"
      courseLabel={courseLabel}
    />
  );
}
