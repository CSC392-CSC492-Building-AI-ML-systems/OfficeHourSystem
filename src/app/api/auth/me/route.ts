import { NextResponse } from "next/server";

import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import { resolveAvailableWorkspaceViews } from "@/lib/auth/resolveHomeRedirect";

export async function GET() {
  const session = await getRequestSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const views = await resolveAvailableWorkspaceViews(
    parseSessionUserId(session),
    session.utorid,
  );

  return NextResponse.json({
    firstName: session.firstName,
    lastName: session.lastName,
    utorid: session.utorid,
    email: session.email,
    canSwitchView: views.length > 1,
  });
}
