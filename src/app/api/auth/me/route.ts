import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/adminList";
import { getRequestSession } from "@/lib/auth/getRequestSession";

export async function GET() {
  const session = await getRequestSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    firstName: session.firstName,
    lastName: session.lastName,
    utorid: session.utorid,
    email: session.email,
    impersonating: Boolean(session.impersonator),
    realUtorid: session.impersonator?.utorid ?? null,
    isAdmin: isAdmin(session.utorid),
  });
}
