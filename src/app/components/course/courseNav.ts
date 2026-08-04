import type { AppNavItem } from "@/app/components/shared/Navbar";

export const COURSE_NAV_ITEMS: AppNavItem[] = [
  { key: "courses", label: "Courses", href: "/course" },
  { key: "queue", label: "My Queue", href: "/course/my-queue" },
];

export const COURSE_NAV_END_ITEMS: AppNavItem[] = [
  { key: "stats", label: "Course Stats", href: "/course/stats" },
];

const ADMIN_NAV_ITEM: AppNavItem = {
  key: "admin",
  label: "Admin",
  href: "/admin",
};

/** Right-side course nav; includes Admin when the user is on adminList. */
export function courseNavEndItems(isAdminUser: boolean): AppNavItem[] {
  return isAdminUser
    ? [ADMIN_NAV_ITEM, ...COURSE_NAV_END_ITEMS]
    : COURSE_NAV_END_ITEMS;
}
