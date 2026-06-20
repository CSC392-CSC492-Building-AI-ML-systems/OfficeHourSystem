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
  offeringParam: string | undefined,
  redirectPath: string,
): Promise<InstructorOfferingPageContext> {
  const session = await getRequestSession();
  if (!session) {
    const params = offeringParam
      ? `?redirect=${encodeURIComponent(`${redirectPath}?offering=${offeringParam}`)}`
      : `?redirect=${encodeURIComponent(redirectPath)}`;
    redirect(`/api/auth/session${params}`);
  }

  const userId = parseSessionUserId(session);
  const context = await requireOfferingTeachingStaff(
    userId,
    offeringParam ?? "",
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
