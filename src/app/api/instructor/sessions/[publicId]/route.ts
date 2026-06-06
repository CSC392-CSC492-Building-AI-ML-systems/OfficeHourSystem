import { NextRequest, NextResponse } from "next/server";

import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import { jsonError } from "@/lib/api/scheduleRouteErrors";
import {
  cancelSession,
  updateSession,
} from "@/lib/queries/officeHourScheduling";
import type { UpdateSessionInput } from "@/lib/scheduling/types";

type RouteContext = { params: Promise<{ publicId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getRequestSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { publicId } = await context.params;
    const body = (await request.json()) as UpdateSessionInput & {
      cancel?: boolean;
    };
    const userId = parseSessionUserId(session);

    if (body.cancel) {
      const result = await cancelSession(userId, publicId);
      return NextResponse.json(result);
    }

    const result = await updateSession(userId, publicId, body);
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error, "Failed to update session.");
  }
}
