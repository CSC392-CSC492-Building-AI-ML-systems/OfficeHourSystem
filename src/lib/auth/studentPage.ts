import { redirect } from "next/navigation";

import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import {
  type OfferingContext,
  requireOfferingStudent,
} from "@/lib/auth/requireOfferingAccess";

export type StudentOfferingPageContext = {
  offeringPublicId: string;
  courseCode: string;
  termCode: string;
  courseLabel: string;
  firstName: string;
  lastName: string;
  role: OfferingContext["role"];
};

export async function resolveStudentOfferingPage(
  offeringPublicId: string | undefined,
  redirectPath: string,
): Promise<StudentOfferingPageContext> {
  const session = await getRequestSession();
  if (!session) {
    redirect(`/api/auth/session?redirect=${encodeURIComponent(redirectPath)}`);
  }

  const userId = parseSessionUserId(session);
  const context = await requireOfferingStudent(userId, offeringPublicId ?? "");

  return {
    offeringPublicId: context.offeringPublicId,
    courseCode: context.courseCode,
    termCode: context.termCode,
    courseLabel: `${context.termCode} · ${context.courseCode}`,
    firstName: session.firstName,
    lastName: session.lastName,
    role: context.role,
  };
}
