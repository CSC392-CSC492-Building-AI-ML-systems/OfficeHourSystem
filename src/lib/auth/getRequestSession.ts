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
