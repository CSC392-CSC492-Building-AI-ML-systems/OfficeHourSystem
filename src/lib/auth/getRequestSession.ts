import { cookies } from "next/headers";
import { getIronSession } from "iron-session";

import { getSessionOptions, type SessionData } from "@/lib/session";

/** Read the sealed `ohsystem_session` cookie for the current request. */
export async function getRequestSession(): Promise<SessionData | null> {
  const session = await getIronSession<SessionData>(
    await cookies(),
    getSessionOptions(),
  );

  if (!session.userId) {
    return null;
  }

  return session;
}

export function parseSessionUserId(session: SessionData): number {
  const userId = Number.parseInt(session.userId, 10);
  if (!Number.isFinite(userId)) {
    throw new Error("Invalid session user id");
  }
  return userId;
}

/** Require an authenticated session and return the user's numeric id. */
export async function requireSessionUserId(): Promise<number> {
  const session = await getRequestSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return parseSessionUserId(session);
}
