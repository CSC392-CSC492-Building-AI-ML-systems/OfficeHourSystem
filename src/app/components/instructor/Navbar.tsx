"use client";

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
  { key: "queues", label: "Today's Sessions", path: "/instructor/my-queues" },
  { key: "schedule", label: "Schedule", path: "/instructor/schedule" },
];

type NavbarProps = {
  activeItem?: InstructorNavItem;
  showSearch?: boolean;
  offeringPublicId?: string;
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
    href: offeringPublicId ? courseRouteHref(path, offeringPublicId) : path,
  }));

  const endItems: AppNavItem[] = offeringPublicId
    ? [
        {
          key: "stats",
          label: "Course Stats",
          href: `/course/stats?offering=${encodeURIComponent(offeringPublicId)}`,
        },
      ]
    : [];

  return (
    <AppNavbar
      items={items}
      endItems={endItems}
      activeKey={activeItem}
      brandHref={"/course"}
      courseLabel={courseLabel}
      showSearch={showSearch}
    />
  );
}
