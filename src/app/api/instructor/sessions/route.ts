import { NextRequest, NextResponse } from "next/server";

import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import { jsonError } from "@/lib/api/scheduleRouteErrors";
import { createOneTimeSession } from "@/lib/queries/officeHourScheduling";
import type { CreateOneTimeSessionInput } from "@/lib/scheduling/types";

export async function POST(request: NextRequest) {
  try {
    const session = await getRequestSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CreateOneTimeSessionInput;

    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: "Title is required." },
        { status: 400 },
      );
    }

    const userId = parseSessionUserId(session);
    const result = await createOneTimeSession(userId, body);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return jsonError(error, "Failed to create session.");
  }
}
