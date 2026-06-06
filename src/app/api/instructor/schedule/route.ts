import { NextRequest, NextResponse } from "next/server";

import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import { jsonError } from "@/lib/api/scheduleRouteErrors";
import { getInstructorSchedulePage } from "@/lib/queries/officeHourScheduling";

export async function GET(request: NextRequest) {
  try {
    const session = await getRequestSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseSessionUserId(session);
    const offeringPublicId =
      request.nextUrl.searchParams.get("offeringPublicId") ?? undefined;
    const weekStart =
      request.nextUrl.searchParams.get("weekStart") ?? undefined;

    const data = await getInstructorSchedulePage(
      userId,
      offeringPublicId,
      weekStart,
    );

    return NextResponse.json(data);
  } catch (error) {
    return jsonError(error, "Failed to load schedule.");
  }
}
