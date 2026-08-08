import { redirect } from "next/navigation";

import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import { resolveHomeRedirectPath } from "@/lib/auth/resolveHomeRedirect";

export default async function HomeRedirectPage() {
  const session = await getRequestSession();
  if (!session) {
    redirect("/api/auth/session?redirect=/home");
  }

  redirect(
    await resolveHomeRedirectPath(parseSessionUserId(session), session.utorid),
  );
}
