"use client";

import { useEffect, useMemo, useState } from "react";

import { ADMIN_NAV_ITEM } from "@/app/components/course/courseNav";
import {
  Navbar as AppNavbar,
  type AppNavItem,
} from "@/app/components/shared/Navbar";
import { courseRouteHref } from "@/lib/offeringUrls";

export type InstructorNavItem = "dashboard" | "queues" | "schedule";

const INSTRUCTOR_NAV: Array<{
  key: InstructorNavItem;
  label: string;
  path: string;
}> = [
  { key: "dashboard", label: "Staff Management", path: "/instructor" },
  { key: "queues", label: "Help Centre", path: "/instructor/my-queues" },
  { key: "schedule", label: "Schedule", path: "/instructor/schedule" },
];

type NavbarProps = {
  activeItem?: InstructorNavItem;
  showSearch?: boolean;
  offeringPublicId: string;
  /** Course-scoped label for the profile menu, e.g. "CSC108 · Term 20265". */
  courseLabel?: string;
};

/** Instructor workspace nav preset over the shared modular Navbar. */
export function Navbar({
  activeItem,
  showSearch = false,
  offeringPublicId,
  courseLabel,
}: NavbarProps) {
  const items: AppNavItem[] = INSTRUCTOR_NAV.map(({ key, label, path }) => ({
    key,
    label,
    href: courseRouteHref(path, offeringPublicId),
  }));

  const statsItem = useMemo<AppNavItem>(
    () => ({
      key: "stats",
      label: "Course Stats",
      href: `/course/stats?offering=${encodeURIComponent(offeringPublicId)}`,
    }),
    [offeringPublicId],
  );
  const [endItems, setEndItems] = useState<AppNavItem[]>([statsItem]);

  useEffect(() => {
    let cancelled = false;

    async function loadAdminNav() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { isAdmin?: boolean };
        if (!cancelled) {
          setEndItems(data.isAdmin ? [ADMIN_NAV_ITEM, statsItem] : [statsItem]);
        }
      } catch {
        if (!cancelled) setEndItems([statsItem]);
      }
    }

    void loadAdminNav();
    return () => {
      cancelled = true;
    };
  }, [statsItem]);

  return (
    <AppNavbar
      items={items}
      endItems={endItems}
      activeKey={activeItem}
      brandHref="/course"
      courseLabel={courseLabel}
      showSearch={showSearch}
    />
  );
}
