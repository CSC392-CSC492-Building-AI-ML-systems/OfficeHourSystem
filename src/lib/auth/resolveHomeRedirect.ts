import type { CourseRole } from "@prisma/client";

import { userCanAccessAdmin } from "@/lib/auth/canAccessAdmin";
import {
  instructorDashboardHref,
  studentDashboardHref,
} from "@/lib/offeringUrls";
import { prisma } from "@/lib/prisma";

/** Default landing path after login for the current user. */
export async function resolveHomeRedirectPath(
  userId: number,
  utorid: string,
): Promise<string> {
  if (await userCanAccessAdmin(userId, utorid)) {
    return "/admin";
  }

  return "/course";
}

export function workspaceHrefForRole(
  role: CourseRole | null | undefined,
  offeringPublicId: string,
): string | null {
  if (role === "INSTRUCTOR" || role === "TA") {
    return instructorDashboardHref(offeringPublicId);
  }

  if (role === "STUDENT") {
    return studentDashboardHref(offeringPublicId);
  }

  return null;
}

export function workspaceLabelForRole(
  role: CourseRole | null | undefined,
): string {
  if (role === "STUDENT") {
    return "Open student dashboard";
  }
  if (role === "INSTRUCTOR" || role === "TA") {
    return "Open instructor workspace";
  }
  return "Open course";
}

export function roleLabelForRole(
  role: CourseRole | null | undefined,
): string | null {
  if (role === "INSTRUCTOR") return "Instructor";
  if (role === "TA") return "TA";
  if (role === "STUDENT") return "Student";
  return null;
}
