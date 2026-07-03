import { redirect } from "next/navigation";

import { StudentPortal } from "@/app/components/student/StudentPortal";
import { userCanAccessAdmin } from "@/lib/auth/canAccessAdmin";
import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
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
  const offerings = await listStudentOfferings(userId);
  const canAccessAdmin = await userCanAccessAdmin(userId, session.utorid);

  return (
    <StudentPortal
      utorid={session.utorid}
      firstName={session.firstName}
      lastName={session.lastName}
      offerings={offerings}
      canAccessAdmin={canAccessAdmin}
    />
  );
}
