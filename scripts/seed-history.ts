/**
 * Seed historical attendance records for realistic wait-time stats.
 *
 * How to run:
 *   npx tsx scripts/seed-history.ts
 *
 * What it does:
 *   1. Creates 5 past OH sessions (spread across last 7 days)
 *   2. Inserts ~40 OfficeHourAttendanceRecord rows with realistic help durations
 *   3. Sets today's "Help Centre" back to SCHEDULED so you can start it fresh
 *   4. Adds liang696 as WAITING in a fresh ACTIVE session for student-queue testing
 */

import "dotenv/config";
import { prisma } from "@/lib/prisma";

// Realistic help durations in minutes (will be used to build timestamps)
// Spread: quick (3-7), normal (8-15), longer (16-25), outliers for trimming (<2, >35)
const HELP_DURATIONS = [
  2,
  4,
  5,
  5,
  6,
  7,
  7,
  8, // short / quick questions
  9,
  10,
  10,
  11,
  12,
  12,
  13, // normal
  14,
  14,
  15,
  15,
  16,
  17, // normal-long
  18,
  19,
  20,
  21,
  22,
  25, // longer
  28,
  30, // edge
  1,
  1,
  38,
  42, // outliers (should be trimmed)
];

function daysAgo(n: number, hour: number, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  console.log("Seeding historical attendance data...\n");

  // ── Find existing offerings ──────────────────────────────────────────────
  const csc301 = await prisma.courseOffering.findFirst({
    where: { course: { code: "CSC301H5" }, termCode: "20261" },
  });
  const csc358 = await prisma.courseOffering.findFirst({
    where: { course: { code: "CSC358H5" }, termCode: "20261" },
  });

  if (!csc301 || !csc358) {
    throw new Error("Run seed-dev.ts and seed-second-course.ts first");
  }

  // ── Grab students to use as attendees ────────────────────────────────────
  const studentUtorids = [
    "dev_alice",
    "dev_bob",
    "dev_carol",
    "dev_dave",
    "liang696",
    "huohaozh",
  ];
  const students = await prisma.user.findMany({
    where: { utorid: { in: studentUtorids } },
    select: { id: true, utorid: true },
  });

  if (students.length === 0) {
    throw new Error("No students found — run seed-dev.ts first");
  }

  // ── Create 5 past sessions ───────────────────────────────────────────────
  const pastSessionDefs = [
    {
      offeringId: csc301.id,
      daysBack: 1,
      hour: 10,
      title: "Morning Drop-in (hist)",
    },
    {
      offeringId: csc301.id,
      daysBack: 2,
      hour: 14,
      title: "Help Centre (hist)",
    },
    {
      offeringId: csc358.id,
      daysBack: 2,
      hour: 12,
      title: "Office Hours (hist)",
    },
    {
      offeringId: csc301.id,
      daysBack: 5,
      hour: 10,
      title: "Morning Drop-in (hist)",
    },
    {
      offeringId: csc358.id,
      daysBack: 6,
      hour: 12,
      title: "Office Hours (hist)",
    },
  ];

  const pastSessions: { id: number; offeringId: number }[] = [];

  for (const def of pastSessionDefs) {
    const startsAt = daysAgo(def.daysBack, def.hour);
    const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);

    const existing = await prisma.officeHourSession.findFirst({
      where: { offeringId: def.offeringId, startsAt },
    });

    if (existing) {
      console.log(`Session already exists: "${def.title}" — skipping`);
      pastSessions.push({ id: existing.id, offeringId: def.offeringId });
      continue;
    }

    const s = await prisma.officeHourSession.create({
      data: {
        offeringId: def.offeringId,
        title: def.title,
        type: "REGULAR",
        startsAt,
        endsAt,
        status: "COMPLETED",
        location: "BA 3175",
      },
    });
    console.log(
      `Created past session: "${s.title}" (${daysAgo(def.daysBack, 0).toDateString()})`,
    );
    pastSessions.push({ id: s.id, offeringId: def.offeringId });
  }

  // ── Insert attendance records across past sessions ────────────────────────
  let recordCount = 0;
  let durationIdx = 0;

  for (const session of pastSessions) {
    // Pick 6-8 students per session (cycle through available students)
    const perSession = Math.min(students.length, 6 + (session.id % 3));

    for (let i = 0; i < perSession; i++) {
      const student = students[i % students.length];
      const helpMinutes = HELP_DURATIONS[durationIdx % HELP_DURATIONS.length];
      durationIdx++;

      // Spread check-in times across the session
      const waitBeforeHelp = 5 + i * 8; // minutes after session start
      const sessionStart = await prisma.officeHourSession.findUnique({
        where: { id: session.id },
        select: { startsAt: true },
      });

      const checkedInAt = new Date(
        sessionStart!.startsAt.getTime() + waitBeforeHelp * 60_000,
      );
      const helpStartedAt = new Date(checkedInAt.getTime() + 2 * 60_000); // 2 min wait to be called
      const helpEndedAt = new Date(
        helpStartedAt.getTime() + helpMinutes * 60_000,
      );

      const existing = await prisma.officeHourAttendanceRecord.findFirst({
        where: { sessionId: session.id, studentId: student.id },
      });
      if (existing) continue;

      await prisma.officeHourAttendanceRecord.create({
        data: {
          sessionId: session.id,
          studentId: student.id,
          checkedInAt,
          helpStartedAt,
          helpEndedAt,
          outcome: "COMPLETED",
        },
      });
      recordCount++;
    }
  }
  console.log(`\nInserted ${recordCount} attendance records`);

  // ── Reset today's ACTIVE Help Centre back to SCHEDULED ────────────
  const resetCount = await prisma.officeHourSession.updateMany({
    where: {
      offering: { termCode: "20261" },
      status: "ACTIVE",
      type: "DEBUGGING",
    },
    data: { status: "SCHEDULED" },
  });
  if (resetCount.count > 0) {
    // Also clear any active attendance for those sessions
    await prisma.officeHourAttendance.deleteMany({
      where: {
        session: {
          status: "SCHEDULED",
          offering: { termCode: "20261" },
          type: "DEBUGGING",
        },
      },
    });
    console.log(
      `Reset ${resetCount.count} Help Centre session(s) to SCHEDULED`,
    );
  }

  // ── Add liang696 as WAITING in today's Help Centre (make it ACTIVE) ─
  const liang = await prisma.user.findUnique({ where: { utorid: "liang696" } });
  const debugSession = await prisma.officeHourSession.findFirst({
    where: {
      offering: { termCode: "20261", course: { code: "CSC301H5" } },
      type: "DEBUGGING",
      status: "SCHEDULED",
    },
  });

  if (liang && debugSession) {
    // Activate the session
    await prisma.officeHourSession.update({
      where: { id: debugSession.id },
      data: { status: "ACTIVE" },
    });

    // Register the DEV TA "test" as a host so they can run this session and help
    // students (a TA must be a session host under the new queue auth rules).
    const taTest = await prisma.user.findUnique({ where: { utorid: "test" } });
    if (taTest) {
      await prisma.officeHourSessionHost.upsert({
        where: {
          sessionId_userId: { sessionId: debugSession.id, userId: taTest.id },
        },
        update: {},
        create: { sessionId: debugSession.id, userId: taTest.id, role: "TA" },
      });
      console.log(`Registered TA "test" as host of "${debugSession.title}"`);
    }

    // Add a few WAITING students ahead of liang696
    const waitingStudents = students
      .filter((s) => !["liang696", "huohaozh"].includes(s.utorid))
      .slice(0, 2);

    let minutesAgo = 20;
    for (const s of waitingStudents) {
      const existing = await prisma.officeHourAttendance.findFirst({
        where: { sessionId: debugSession.id, studentId: s.id },
      });
      if (!existing) {
        await prisma.officeHourAttendance.create({
          data: {
            sessionId: debugSession.id,
            studentId: s.id,
            status: "WAITING",
            checkedInAt: new Date(Date.now() - minutesAgo * 60_000),
          },
        });
        minutesAgo -= 8;
      }
    }

    // Add liang696 as WAITING (last, so position 3)
    const liangExisting = await prisma.officeHourAttendance.findFirst({
      where: { sessionId: debugSession.id, studentId: liang.id },
    });
    if (!liangExisting) {
      await prisma.officeHourAttendance.create({
        data: {
          sessionId: debugSession.id,
          studentId: liang.id,
          status: "WAITING",
          checkedInAt: new Date(Date.now() - 5 * 60_000),
        },
      });
      console.log(
        `Added liang696 as WAITING in "${debugSession.title}" (position 3)`,
      );
    }
  }

  console.log("\nDone.");
  console.log(
    "  • Start a session at /instructor/my-queues to trigger wait-stats recompute",
  );
  console.log(
    "  • Login as liang696 (DEV_ROLE=STUDENT) and go to /student/my-queue",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
