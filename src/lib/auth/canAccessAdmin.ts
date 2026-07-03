import { isAdmin } from "@/lib/adminList";
import { getOfferingContextForUser } from "@/lib/auth/requireOfferingAccess";
import { prisma } from "@/lib/prisma";
import type { SessionData } from "@/lib/session";

import { getRequestSession, parseSessionUserId } from "./getRequestSession";

/** Only super-admins (adminList.txt) may upload classlists and create new offerings. */
export function canUploadAdminClasslist(utorid: string): boolean {
  return isAdmin(utorid);
}

/** Require login and super-admin (adminList.txt) access. */
export async function requireSuperAdminAccess(): Promise<SessionData> {
  const session = await getRequestSession();
  if (!session) {
    throw new Error("Authentication required");
  }

  if (!isAdmin(session.utorid)) {
    throw new Error("Super-admin access required");
  }

  return session;
}

/** Super-admins may add instructors to any offering; others only on courses they teach. */
export async function canAddOfferingInstructor(
  userId: number,
  utorid: string,
  offeringPublicId: string,
): Promise<boolean> {
  if (isAdmin(utorid)) {
    return true;
  }

  const context = await getOfferingContextForUser(userId, offeringPublicId);
  return context?.role === "INSTRUCTOR";
}

/** True when the user is on adminList.txt or has `isInstructor` in the database. */
export async function userCanAccessAdmin(
  userId: number,
  utorid: string,
): Promise<boolean> {
  if (isAdmin(utorid)) {
    return true;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isInstructor: true },
  });

  return user?.isInstructor === true;
}

/** Require login plus admin-page access (admin list or platform instructor). */
export async function requireAdminPageAccess(): Promise<SessionData> {
  const session = await getRequestSession();
  if (!session) {
    throw new Error("Authentication required");
  }

  const userId = parseSessionUserId(session);
  const allowed = await userCanAccessAdmin(userId, session.utorid);
  if (!allowed) {
    throw new Error("Admin access required");
  }

  return session;
}
