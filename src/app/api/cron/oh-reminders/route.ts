import { NextRequest, NextResponse } from "next/server";

import { sendDueOhReminders } from "@/lib/reminders/sendDueOhReminders";

// Prisma needs the Node runtime; never cache a job trigger.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/cron/oh-reminders
//
// Triggered by the external scheduler (host crontab / compose sidecar) every
// ~15 min. Guarded by a shared secret so it can't be fired from the public
// internet. Sends any due office-hour reminders and returns a small summary.
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await sendDueOhReminders();
  return NextResponse.json(result);
}
