"use server";

import { startSessionService } from "@/services/start_session/start-session";

export async function startSessionAction(sessionPublicId: string) {
  return startSessionService(sessionPublicId);
}
