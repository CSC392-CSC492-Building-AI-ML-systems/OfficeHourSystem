import type { CourseRole } from "@prisma/client";

import {
  getMemberRole,
  type OfferingIdentifier,
  type UserIdentifier,
} from "@/lib/queries/offeringMember";
import { prisma } from "@/lib/prisma";
import type { SessionData } from "@/lib/session";

import { getRequestSession, parseSessionUserId } from "./getRequestSession";

/** Role for a user in a specific course offering, from the database. */
export async function getUserRoleInOffering(
  userIdentifier: UserIdentifier,
  offeringIdentifier: OfferingIdentifier,
): Promise<CourseRole | null> {
  const result = await getMemberRole(userIdentifier, offeringIdentifier);
  return result?.role ?? null;
}

/** Require an authenticated session whose user has `isInstructor` set in the database. */
export async function requireInstructorSession(): Promise<SessionData> {
  const session = await getRequestSession();
  if (!session) {
    throw new Error("Authentication required");
  }

  const user = await prisma.user.findUnique({
    where: { id: parseSessionUserId(session) },
    select: { isInstructor: true },
  });

  if (!user?.isInstructor) {
    throw new Error("Instructor role required");
  }

  return session;
}
