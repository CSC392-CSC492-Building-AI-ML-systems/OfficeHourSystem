import type { AppNavItem } from "@/app/components/shared/Navbar";

export const COURSE_NAV_ITEMS: AppNavItem[] = [
  { key: "courses", label: "Courses", href: "/course" },
  { key: "queue", label: "My Queue", href: "/course/my-queue" },
];

export const COURSE_NAV_END_ITEMS: AppNavItem[] = [
  { key: "stats", label: "Course Stats", href: "/course/stats" },
];
