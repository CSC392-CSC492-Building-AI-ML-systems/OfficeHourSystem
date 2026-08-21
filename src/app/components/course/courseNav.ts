import type { AppNavItem } from "@/app/components/shared/Navbar";

export const COURSE_NAV_ITEMS: AppNavItem[] = [
  { key: "courses", label: "Courses", href: "/course" },
  { key: "queue", label: "My Queue", href: "/course/my-queue" },
];

export const STUDENT_COURSE_NAV_ITEMS: AppNavItem[] = [
  { key: "courses", label: "Courses", href: "/course" },
  {
    key: "interested",
    label: "My Interested Office Hours",
    href: "/course/my-interested-office-hours",
  },
  { key: "queue", label: "My Queue", href: "/course/my-queue" },
];

export const COURSE_STATS_NAV_ITEM: AppNavItem = {
  key: "stats",
  label: "Course Stats",
  href: "/course/stats",
};

const ADMIN_NAV_ITEM: AppNavItem = {
  key: "admin",
  label: "Admin",
  href: "/admin",
};

/** Right-side course nav; Admin for adminList, Course Stats for instructors. */
export function courseNavEndItems(
  isAdminUser: boolean,
  isInstructor: boolean,
): AppNavItem[] {
  return [
    ...(isAdminUser ? [ADMIN_NAV_ITEM] : []),
    ...(isInstructor ? [COURSE_STATS_NAV_ITEM] : []),
  ];
}
