"use client";

import { usePathname } from "next/navigation";

import {
  Navbar as AppNavbar,
  type AppNavItem,
} from "@/app/components/shared/Navbar";

const STUDENT_NAV: AppNavItem[] = [
  { key: "courses", label: "Courses", href: "/course" },
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
  const items = showQueueLink
    ? STUDENT_NAV
    : STUDENT_NAV.filter((item) => item.key !== "queue");
  const activeKey = items.find((item) => item.href === pathname)?.key;

  return (
    <AppNavbar
      items={items}
      activeKey={activeKey}
      brandHref="/"
      courseLabel={courseLabel}
    />
  );
}
