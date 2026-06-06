import { NextResponse } from "next/server";

import { ScheduleAuthError } from "@/lib/scheduling/auth";

export function jsonError(error: unknown, fallbackMessage: string) {
  if (error instanceof ScheduleAuthError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }

  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
