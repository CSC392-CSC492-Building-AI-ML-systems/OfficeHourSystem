import type { CourseRole } from "@prisma/client";

import {
  getMemberRole,
  type OfferingIdentifier,
  type UserIdentifier,
} from "@/lib/queries/offeringMember";

import { getRequestSession } from "./getRequestSession";
import type { SessionData } from "@/lib/session";

const SESSION_ROLES: CourseRole[] = ["STUDENT", "TA", "INSTRUCTOR"];

function normalizeSessionRole(role: string): CourseRole | null {
  if (SESSION_ROLES.includes(role as CourseRole)) {
    return role as CourseRole;
  }

  return null;
}

/** Role stored in the iron-session cookie (whitelist / DEV_ROLE). */
export function getRoleFromSession(session: SessionData): CourseRole | null {
  return normalizeSessionRole(session.role);
}

/** Current request user's session role, or null when unauthenticated. */
export async function getSessionUserRole(): Promise<CourseRole | null> {
  const session = await getRequestSession();
  if (!session) {
    return null;
  }

  return getRoleFromSession(session);
}

/** Role for a user in a specific course offering, from the database. */
export async function getUserRoleInOffering(
  userIdentifier: UserIdentifier,
  offeringIdentifier: OfferingIdentifier,
): Promise<CourseRole | null> {
  const result = await getMemberRole(userIdentifier, offeringIdentifier);
  return result?.role ?? null;
}

/** Require a valid session whose cookie role is INSTRUCTOR. */
export async function requireInstructorSession(): Promise<SessionData> {
  const session = await getRequestSession();
  if (!session) {
    throw new Error("Authentication required");
  }

  const role = getRoleFromSession(session);
  if (role !== "INSTRUCTOR") {
    throw new Error("Instructor role required");
  }

  return session;
}
