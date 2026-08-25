import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import { serializeAttendanceExportCsv } from "@/lib/csv/attendanceExport";
import { prisma } from "@/lib/prisma";
import { getOfferingAttendanceExportRows } from "@/lib/queries/course_stats/attendance-export";
import { getOfferingByPublicId } from "@/lib/queries/course_stats/course-overview";

async function requireInstructorOffering(offeringPublicId: string) {
  const session = await getRequestSession();
  if (!session) throw new Error("Unauthorized");
  const userId = parseSessionUserId(session);

  const offering = await getOfferingByPublicId(offeringPublicId);
  if (!offering) throw new Error("Offering not found");

  const member = await prisma.offeringMember.findUnique({
    where: { userId_offeringId: { userId, offeringId: offering.id } },
    select: { role: true },
  });
  if (!member || member.role !== "INSTRUCTOR") {
    throw new Error(
      "Forbidden: only the course instructor can export attendance",
    );
  }
  return offering;
}

export async function exportOfferingAttendanceCsvService(
  offeringPublicId: string,
): Promise<{ csv: string; filename: string }> {
  const offering = await requireInstructorOffering(offeringPublicId);
  const rows = await getOfferingAttendanceExportRows(offering.id);
  return {
    csv: serializeAttendanceExportCsv(rows),
    filename: `${offering.course.code}-${offering.termCode}-attendance.csv`,
  };
}
