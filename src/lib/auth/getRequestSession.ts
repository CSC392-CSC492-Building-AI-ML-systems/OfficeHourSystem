import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

import { getSessionOptions, type SessionData } from "@/lib/session";

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
