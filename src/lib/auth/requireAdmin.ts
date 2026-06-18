import { getRequestSession } from "@/lib/auth/getRequestSession";
import type { SessionData } from "@/lib/session";
import { isAdmin } from "@/lib/adminList";

/** Require an authenticated session whose UTORid is on the admin list. */
export async function requireAdminSession(): Promise<SessionData> {
  const session = await getRequestSession();
  if (!session) {
    throw new Error("Authentication required");
  }

  if (!isAdmin(session.utorid)) {
    throw new Error("Admin access required");
  }

  return session;
}
