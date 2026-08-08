import { redirect } from "next/navigation";

import { StudentPortal } from "@/app/components/student/StudentPortal";
import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import {
  resolveAvailableWorkspaceViews,
  resolveDefaultWorkspacePath,
} from "@/lib/auth/resolveHomeRedirect";
import { buildLegacyOfferingRedirectUrl } from "@/lib/legacyOfferingRedirect";
import { listStudentOfferings } from "@/lib/queries/student/offerings";

type PageProps = {
  searchParams: Promise<{ offering?: string }>;
};

export default async function StudentPortalPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const legacyDestination = buildLegacyOfferingRedirectUrl(params, "/student");
  if (legacyDestination) {
    redirect(legacyDestination);
  }

  const session = await getRequestSession();
  if (!session) {
    redirect("/api/auth/session?redirect=/student");
  }

  const userId = parseSessionUserId(session);
  const views = await resolveAvailableWorkspaceViews(userId, session.utorid);
  if (!views.includes("student")) {
    redirect(resolveDefaultWorkspacePath(views));
  }

  const offerings = await listStudentOfferings(userId);

  return (
    <StudentPortal
      utorid={session.utorid}
      firstName={session.firstName}
      lastName={session.lastName}
      offerings={offerings}
    />
  );
}
