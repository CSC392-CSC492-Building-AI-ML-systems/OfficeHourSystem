/**
 * Sets up a clean end-to-end test scenario for the Student My Queue flow.
 *
 * What gets created:
 *   - A fresh ACTIVE session in CSC301H5 (runs now → +4 hours)
 *   - "stuahed1" — already WAITING (position 1), enrolled as STUDENT
 *   - "scantst1" — enrolled as STUDENT, NOT yet in queue (scan them in manually)
 *   - TA account: "test" (already exists, already TA in CSC301H5)
 *
 * Test flow:
 *   1. Login as "test" (TA), go to /instructor/my-queues → open scan page
 *   2. Type "scantst1" → should check in → they become position 2
 *   3. Switch to "scantst1" login → /student/my-queue → confirm position 2
 *   4. Switch back to "test" (TA) → active queue → help stuahed1 (complete them)
 *   5. Switch to "scantst1" → my-queue should now show position 1
 *
 * How to run:
 *   npx tsx scripts/seed-queue-test.ts
 */

import "dotenv/config";
import { prisma } from "@/lib/prisma";

async function main() {
  console.log("Setting up queue test scenario...\n");

  // 1. Find CSC301H5 offering
  const offering = await prisma.courseOffering.findFirst({
    where: { course: { code: "CSC301H5" }, termCode: "20261" },
  });
  if (!offering)
    throw new Error("CSC301H5 offering not found — run seed-dev.ts first");

  // 2. Confirm TA account exists
  const ta = await prisma.user.findUnique({ where: { utorid: "test" } });
  if (!ta) throw new Error("TA user 'test' not found — run seed-dev.ts first");

  const taMembership = await prisma.offeringMember.findUnique({
    where: { userId_offeringId: { userId: ta.id, offeringId: offering.id } },
  });
  if (!taMembership || taMembership.role === "STUDENT") {
    await prisma.offeringMember.upsert({
      where: { userId_offeringId: { userId: ta.id, offeringId: offering.id } },
      update: { role: "TA" },
      create: { userId: ta.id, offeringId: offering.id, role: "TA" },
    });
  }
  console.log(`TA account: utorid="test", role=TA in CSC301H5`);

  // 3. Create the ACTIVE session (now → +4 hours)
  const now = new Date();
  const endsAt = new Date(now.getTime() + 4 * 60 * 60 * 1000);

  // Created as SCHEDULED so it shows in the default "Upcoming" tab — the TA
  // clicks "Start Session" to host it (→ ACTIVE), then opens the scanner.
  let session = await prisma.officeHourSession.findFirst({
    where: { offeringId: offering.id, title: "Queue Test Session" },
  });

  if (session) {
    // Reset back to SCHEDULED so the flow can be re-run from the start
    session = await prisma.officeHourSession.update({
      where: { id: session.id },
      data: { status: "SCHEDULED", startsAt: now, endsAt },
    });
    console.log(`Reset existing session to SCHEDULED (id=${session.id})`);
  } else {
    session = await prisma.officeHourSession.create({
      data: {
        offeringId: offering.id,
        title: "Queue Test Session",
        type: "DEBUGGING",
        startsAt: now,
        endsAt,
        location: "BA 3110",
        status: "SCHEDULED",
      },
    });
    console.log(
      `Created SCHEDULED session: "${session.title}" (id=${session.id})`,
    );
  }

  // 3b. Register the TA as a host so they can start/scan/help in this session
  // (a TA must be a session host under the new queue auth rules)
  await prisma.officeHourSessionHost.upsert({
    where: { sessionId_userId: { sessionId: session.id, userId: ta.id } },
    update: {},
    create: { sessionId: session.id, userId: ta.id, role: "TA" },
  });
  console.log(`Registered TA "test" as host of "${session.title}"`);

  // 4. Upsert the two student accounts
  const studentDefs = [
    { utorid: "stuahed1", firstName: "Stu", lastName: "Ahead" },
    { utorid: "scantst1", firstName: "Scan", lastName: "Test" },
  ];

  const studentUsers: Record<string, { id: number }> = {};

  for (const def of studentDefs) {
    const user = await prisma.user.upsert({
      where: { utorid: def.utorid },
      update: { firstName: def.firstName, lastName: def.lastName },
      create: {
        utorid: def.utorid,
        firstName: def.firstName,
        lastName: def.lastName,
        email: `${def.utorid}@mail.utoronto.ca`,
      },
    });

    await prisma.offeringMember.upsert({
      where: {
        userId_offeringId: { userId: user.id, offeringId: offering.id },
      },
      update: { role: "STUDENT" },
      create: { userId: user.id, offeringId: offering.id, role: "STUDENT" },
    });

    studentUsers[def.utorid] = { id: user.id };
    console.log(
      `Student: utorid="${def.utorid}" enrolled as STUDENT in CSC301H5`,
    );
  }

  // 5. Put stuahed1 in the queue as WAITING (position 1), but not scantst1
  const stuAhead = studentUsers["stuahed1"]!;
  const existing = await prisma.officeHourAttendance.findFirst({
    where: { sessionId: session.id, studentId: stuAhead.id },
  });

  if (existing) {
    console.log(`stuahed1 already in queue — skipping`);
  } else {
    await prisma.officeHourAttendance.create({
      data: {
        sessionId: session.id,
        studentId: stuAhead.id,
        status: "WAITING",
        checkedInAt: new Date(Date.now() - 10 * 60_000), // checked in 10 min ago
      },
    });
    console.log(
      `Added stuahed1 as WAITING (position 1, checked in 10 min ago)`,
    );
  }

  // scantst1 is NOT in the queue yet — user will scan them in manually
  console.log(
    `scantst1 is enrolled but NOT in queue — scan them in via the scan page`,
  );

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test scenario ready. Follow these steps:

Step 1 — Login as TA and START the session:
  DEV_UTORID=test → visit /api/auth/session → /instructor/my-queues
  Default "Upcoming" tab shows "Queue Test Session" → click "Start Session ▶"
  → it becomes ACTIVE and opens the active queue page

Step 2 — Open the scanner and scan the student in:
  On the active queue page → click "Start Scanning" → Confirm
  Type  scantst1  → should show "Scan Test checked in"
  scantst1 is now position 2 (stuahed1 is position 1)

Step 3 — Check student view:
  DEV_UTORID=scantst1 → /api/auth/session → /student/my-queue
  Should show: Queue Test Session, position 2

Step 4 — Help the student ahead (as TA):
  DEV_UTORID=test → /api/auth/session → active queue
  Move stuahed1 from WAITING → IN_HELP → complete them

Step 5 — Verify queue updated (as student):
  DEV_UTORID=scantst1 → /api/auth/session → /student/my-queue
  scantst1 should now show position 1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
