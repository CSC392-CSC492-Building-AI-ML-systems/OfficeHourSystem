import { redirect } from "next/navigation";

import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import {
  type OfferingContext,
  requireOfferingTeachingStaff,
} from "@/lib/auth/requireOfferingAccess";

export type InstructorOfferingPageContext = {
  offeringPublicId: string;
  courseCode: string;
  termCode: string;
  courseLabel: string;
  role: OfferingContext["role"];
  canEdit: boolean;
};

export async function resolveInstructorOfferingPage(
  offeringPublicId: string | undefined,
  redirectPath: string,
): Promise<InstructorOfferingPageContext> {
  const session = await getRequestSession();
  if (!session) {
    redirect(`/api/auth/session?redirect=${encodeURIComponent(redirectPath)}`);
  }

  const userId = parseSessionUserId(session);
  const context = await requireOfferingTeachingStaff(
    userId,
    offeringPublicId ?? "",
  );

  return {
    offeringPublicId: context.offeringPublicId,
    courseCode: context.courseCode,
    termCode: context.termCode,
    courseLabel: `${context.courseCode} · Term ${context.termCode}`,
    role: context.role,
    canEdit: context.canEdit,
  };
}
