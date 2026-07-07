/**
 * Creates a "dual role" test user: TA in CSC301H5, STUDENT in CSC358H5.
 * Also adds them as WAITING in today's CSC358H5 session (if one exists).
 *
 * How to run:
 *   npx tsx scripts/seed-dual-role.ts
 *
 * Prerequisite: run seed-dev.ts and seed-second-course.ts first.
 */

import "dotenv/config";
import { prisma } from "@/lib/prisma";

async function main() {
  console.log("Seeding dual-role user...\n");

  // 1. Upsert the dual-role user
  const user = await prisma.user.upsert({
    where: { utorid: "dual001" },
    update: {
      firstName: "Alex",
      lastName: "Dual",
      email: "dual001@mail.utoronto.ca",
    },
    create: {
      utorid: "dual001",
      firstName: "Alex",
      lastName: "Dual",
      email: "dual001@mail.utoronto.ca",
    },
  });
  console.log(`User: id=${user.id}, utorid=${user.utorid}`);

  // 2. Find existing offerings
  const csc301Offering = await prisma.courseOffering.findFirst({
    where: { course: { code: "CSC301H5" }, termCode: "20261" },
  });
  const csc358Offering = await prisma.courseOffering.findFirst({
    where: { course: { code: "CSC358H5" }, termCode: "20261" },
  });

  if (!csc301Offering)
    throw new Error("CSC301H5 offering not found — run seed-dev.ts first");
  if (!csc358Offering)
    throw new Error(
      "CSC358H5 offering not found — run seed-second-course.ts first",
    );

  // 3. TA in CSC301H5
  await prisma.offeringMember.upsert({
    where: {
      userId_offeringId: { userId: user.id, offeringId: csc301Offering.id },
    },
    update: { role: "TA" },
    create: { userId: user.id, offeringId: csc301Offering.id, role: "TA" },
  });
  console.log(`Role: TA in CSC301H5 (offeringId=${csc301Offering.id})`);

  // 3b. Host dual001 on today's CSC301H5 sessions — a TA must be a session host
  // to operate the queue under the new auth rules, so the TA view is testable.
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const csc301Sessions = await prisma.officeHourSession.findMany({
    where: {
      offeringId: csc301Offering.id,
      startsAt: { gte: todayStart, lte: todayEnd },
    },
    select: { id: true },
  });
  for (const s of csc301Sessions) {
    await prisma.officeHourSessionHost.upsert({
      where: { sessionId_userId: { sessionId: s.id, userId: user.id } },
      update: {},
      create: { sessionId: s.id, userId: user.id, role: "TA" },
    });
  }
  console.log(
    `Host: dual001 on ${csc301Sessions.length} CSC301H5 session(s) today`,
  );

  // 4. STUDENT in CSC358H5
  await prisma.offeringMember.upsert({
    where: {
      userId_offeringId: { userId: user.id, offeringId: csc358Offering.id },
    },
    update: { role: "STUDENT" },
    create: { userId: user.id, offeringId: csc358Offering.id, role: "STUDENT" },
  });
  console.log(`Role: STUDENT in CSC358H5 (offeringId=${csc358Offering.id})`);

  // 5. If there's an ACTIVE or SCHEDULED session in CSC358H5 today, add them as WAITING
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const session = await prisma.officeHourSession.findFirst({
    where: {
      offeringId: csc358Offering.id,
      status: { in: ["ACTIVE", "SCHEDULED"] },
      startsAt: { gte: startOfDay, lte: endOfDay },
    },
  });

  if (session) {
    // Check not already in queue
    const existing = await prisma.officeHourAttendance.findFirst({
      where: { sessionId: session.id, studentId: user.id },
    });
    if (!existing) {
      await prisma.officeHourAttendance.create({
        data: { sessionId: session.id, studentId: user.id, status: "WAITING" },
      });
      console.log(
        `Added as WAITING in session "${session.title}" (sessionId=${session.id})`,
      );
    } else {
      console.log(`Already in queue for session "${session.title}" — skipping`);
    }
  } else {
    console.log(
      "No active/scheduled session in CSC358H5 today — skipping queue insert",
    );
  }

  console.log("\nDone.");
  console.log("  utorid : dual001");
  console.log("  CSC301H5 : TA");
  console.log("  CSC358H5 : STUDENT");
  console.log(
    "\nTo test: set DEV_UTORID=dual001 in .env, then visit /api/auth/session to re-login.",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
