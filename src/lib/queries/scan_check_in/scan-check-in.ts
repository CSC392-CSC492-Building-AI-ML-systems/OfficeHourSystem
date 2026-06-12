import { prisma } from "@/lib/prisma";
import type { IdentifierType, ScanCheckInResult } from "@/lib/types/queue";

// ── Barcode mock ──────────────────────────────────────────────────────────────
// Real barcode → user matching requires an external service we don't have yet.
// This map lets us test the flow end-to-end in development.
// Only used when identifierType === "barcode".
const MOCK_BARCODE_MAP: Record<string, string> = {
  "1234567890123456": "Mock Student",
  "9999999999999999": "Test User",
  "2176301960087102": "Test User2",
  "2176102914868302": "Jingcheng Liang",
  "2176103009687101": "Jacky Huo",
};

export async function scanCheckIn(
  sessionId: number,
  offeringId: number,
  identifierType: IdentifierType,
  identifierValue: string,
): Promise<ScanCheckInResult> {

  // ── Barcode: use mock map, never hit the real DB for user lookup ──
  if (identifierType === "barcode") {
    const mockName = MOCK_BARCODE_MAP[identifierValue];
    if (!mockName) return { outcome: "student_not_found" };
    return { outcome: "mock_user", studentName: mockName };
  }

  // ── Find the student by student_number or utorid ──────────────────
  const student = await prisma.user.findFirst({
    where:
      identifierType === "student_number"
        ? { studentNumber: identifierValue }
        : { utorid: identifierValue },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      publicId: true,
    },
  });

  if (!student) return { outcome: "student_not_found" };

  const studentName =
    [student.firstName, student.lastName].filter(Boolean).join(" ") ||
    student.publicId;

  // ── Verify the student is enrolled in this offering ───────────────
  const membership = await prisma.offeringMember.findUnique({
    where: {
      userId_offeringId: {
        userId: student.id,
        offeringId,
      },
    },
    select: { role: true },
  });

  if (!membership || membership.role !== "STUDENT") {
    return { outcome: "not_enrolled" };
  }

  // ── Insert attendance (unique constraint handles duplicates) ──────



  try {
    await prisma.officeHourAttendance.create({
      data: {
        sessionId,
        studentId: student.id,
        status: "WAITING",
        checkedInAt: new Date(),
      },
    });
    return { outcome: "checked_in", studentName };
  } catch (e: unknown) {
    // Prisma unique constraint violation → student already in queue
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code: string }).code === "P2002"
    ) {
      return { outcome: "already_in_queue", studentName };
    }
    throw e;
  }
}
