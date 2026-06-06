import { NextRequest, NextResponse } from "next/server";

import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import { jsonError } from "@/lib/api/scheduleRouteErrors";
import { createRecurringBlock } from "@/lib/queries/officeHourScheduling";
import type { CreateRecurringBlockInput } from "@/lib/scheduling/types";

export async function POST(request: NextRequest) {
  try {
    const session = await getRequestSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CreateRecurringBlockInput;
    const input: CreateRecurringBlockInput = {
      ...body,
      title: body.title?.trim() ? body.title.trim() : "Office Hours",
    };

    const userId = parseSessionUserId(session);
    const result = await createRecurringBlock(userId, input);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return jsonError(error, "Failed to create recurring block.");
  }
}
