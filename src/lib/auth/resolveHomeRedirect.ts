import type { CourseRole } from "@prisma/client";

import { isAdmin } from "@/lib/adminList";
import {
  buildAvailableWorkspaceViews,
  resolveDefaultWorkspacePath,
} from "@/lib/auth/workspaceViews";
import {
  instructorDashboardHref,
  studentDashboardHref,
} from "@/lib/offeringUrls";
import { prisma } from "@/lib/prisma";

export {
  resolveDefaultWorkspacePath,
  WORKSPACE_VIEW_HREFS,
  type WorkspaceView,
} from "@/lib/auth/workspaceViews";
import type { WorkspaceView } from "@/lib/auth/workspaceViews";

/** Views the user may select, ordered for display. */
export async function resolveAvailableWorkspaceViews(
  userId: number,
  utorid: string,
): Promise<WorkspaceView[]> {
  const viewerIsAdmin = isAdmin(utorid);
  const [user, memberships] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { isInstructor: true },
    }),
    prisma.offeringMember.findMany({
      where: { userId },
      select: { role: true },
    }),
  ]);

  return buildAvailableWorkspaceViews({
    viewerIsAdmin,
    isInstructor: user?.isInstructor === true,
    roles: memberships.map(({ role }) => role),
  });
}

/** Default landing path after login for the current user. */
export async function resolveHomeRedirectPath(
  userId: number,
  utorid: string,
): Promise<string> {
  const views = await resolveAvailableWorkspaceViews(userId, utorid);
  return resolveDefaultWorkspacePath(views);
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
