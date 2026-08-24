import { NextResponse } from "next/server";

import { exportOfferingAttendanceCsvService } from "@/services/course_stats/attendance-export";

export async function GET(request: Request) {
  const offering = new URL(request.url).searchParams.get("offering");
  if (!offering) {
    return NextResponse.json(
      { error: "Missing offering parameter" },
      { status: 400 },
    );
  }

  try {
    const { csv, filename } =
      await exportOfferingAttendanceCsvService(offering);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Export failed";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    if (message.startsWith("Forbidden")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message === "Offering not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
