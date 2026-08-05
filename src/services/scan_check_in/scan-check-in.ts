import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import { assertSessionOperator } from "@/lib/auth/sessionOperator";
import { prisma } from "@/lib/prisma";
import { getMcsAdminClient } from "@/lib/mcs/get-mcs-admin-client";
import { scanCheckIn } from "@/lib/queries/scan_check_in/scan-check-in";
import type { IdentifierType, ScanCheckInResult } from "@/lib/types/queue";

export async function scanCheckInService(
  sessionPublicId: string,
  identifierType: IdentifierType,
  identifierValue: string,
): Promise<ScanCheckInResult> {
  // Step 1: Validate cookie, get current user (the TA running the scanner)
  const session = await getRequestSession();
  if (!session) throw new Error("Unauthorized");
  const userId = parseSessionUserId(session);

  // Step 2: Find the office hour session
  const ohSession = await prisma.officeHourSession.findUnique({
    where: { publicId: sessionPublicId },
    select: { id: true, offeringId: true, status: true },
  });
  if (!ohSession) throw new Error("Session not found");

  // Step 3: Session must be ACTIVE to accept check-ins
  if (ohSession.status !== "ACTIVE") {
    return { outcome: "session_not_active" };
  }

  // Step 4: Only the offering's instructor or a host of this session may scan
  await assertSessionOperator(userId, ohSession.id, ohSession.offeringId);

  // Step 5: Resolve an NFC CSN through MCS without storing it locally.
  if (identifierType === "csn") {
    try {
      const utorid =
        await getMcsAdminClient().lookupUtoridByCsn(identifierValue);
      if (!utorid) return { outcome: "student_not_found" };

      return scanCheckIn(ohSession.id, ohSession.offeringId, "utorid", utorid);
    } catch {
      return { outcome: "csn_lookup_unavailable" };
    }
  }

  // Step 6: Look up the student and insert attendance
  return scanCheckIn(
    ohSession.id,
    ohSession.offeringId,
    identifierType,
    identifierValue,
  );
}
