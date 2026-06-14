"use server";

import { endSessionService } from "@/services/end_session/end-session";

export async function endSessionAction(sessionPublicId: string) {
  return endSessionService(sessionPublicId);
}
