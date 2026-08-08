import type { CourseRole } from "@prisma/client";

export type WorkspaceView = "student" | "instructor" | "admin";

export const WORKSPACE_VIEW_HREFS: Record<WorkspaceView, string> = {
  student: "/student",
  instructor: "/course",
  admin: "/admin",
};

type WorkspaceViewInputs = {
  viewerIsAdmin: boolean;
  isInstructor: boolean;
  roles: Iterable<CourseRole>;
};

export function buildAvailableWorkspaceViews({
  viewerIsAdmin,
  isInstructor,
  roles,
}: WorkspaceViewInputs): WorkspaceView[] {
  const roleSet = new Set(roles);
  const hasInstructorView =
    viewerIsAdmin ||
    isInstructor ||
    roleSet.has("INSTRUCTOR") ||
    roleSet.has("TA");
  const hasStudentView = roleSet.has("STUDENT") || !hasInstructorView;

  return [
    ...(hasStudentView ? (["student"] as const) : []),
    ...(hasInstructorView ? (["instructor"] as const) : []),
    ...(viewerIsAdmin ? (["admin"] as const) : []),
  ];
}

export function resolveDefaultWorkspacePath(views: WorkspaceView[]): string {
  if (views.includes("admin")) return WORKSPACE_VIEW_HREFS.admin;
  if (views.includes("instructor")) return WORKSPACE_VIEW_HREFS.instructor;
  return WORKSPACE_VIEW_HREFS.student;
}
