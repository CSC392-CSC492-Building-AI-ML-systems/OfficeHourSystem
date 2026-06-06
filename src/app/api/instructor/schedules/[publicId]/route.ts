import { NextRequest, NextResponse } from "next/server";

import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import { jsonError } from "@/lib/api/scheduleRouteErrors";
import {
  deleteRecurringBlock,
  updateRecurringBlock,
} from "@/lib/queries/officeHourScheduling";
import type { UpdateRecurringBlockInput } from "@/lib/scheduling/types";

type RouteContext = { params: Promise<{ publicId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getRequestSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { publicId } = await context.params;
    const body = (await request.json()) as UpdateRecurringBlockInput;
    const userId = parseSessionUserId(session);
    const result = await updateRecurringBlock(userId, publicId, body);

    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error, "Failed to update recurring block.");
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getRequestSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { publicId } = await context.params;
    const userId = parseSessionUserId(session);
    const result = await deleteRecurringBlock(userId, publicId);

    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error, "Failed to delete recurring block.");
  }
}
