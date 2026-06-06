import type { OfficeHourType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import { jsonError } from "@/lib/api/scheduleRouteErrors";
import { getUpcomingSessionsForHost } from "@/lib/queries/officeHourScheduling";

export async function GET(request: NextRequest) {
  try {
    const session = await getRequestSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseSessionUserId(session);
    const typeFilter = request.nextUrl.searchParams.get("types");
    const types: OfficeHourType[] | undefined =
      typeFilter === "DEBUGGING" ? ["DEBUGGING"] : undefined;

    const sessions = await getUpcomingSessionsForHost(userId, {
      types,
      daysAhead: 14,
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    return jsonError(error, "Failed to load queue sessions.");
  }
}
