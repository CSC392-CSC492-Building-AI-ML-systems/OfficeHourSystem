/**
 * Seeds DEBUGGING office-hour history for testing the "My Course Stats" use case.
 *
 * Creates an INSTRUCTOR account `prof01` in CSC301H5 (the stats page is
 * INSTRUCTOR-only) plus several DEBUGGING sessions with attendance records,
 * hosts, and interest rows so every metric / NA case is exercised.
 *
 * How to run:
 *   npx tsx scripts/seed-debug-stats.ts
 *
 * Prerequisite: seed-dev.ts (creates CSC301H5 + offering).
 *
 * Then: set DEV_UTORID=prof01 → visit /api/auth/session → /instructor/course-stats
 *
 * Safe to re-run — existing sessions (by title) are skipped.
 */

import "dotenv/config";
import { prisma } from "@/lib/prisma";

function daysAgo(n: number, hour: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function daysFromNow(n: number, hour: number): Date {
  return daysAgo(-n, hour);
}

async function ensureUser(utorid: string, firstName: string, lastName: string) {
  return prisma.user.upsert({
    where: { utorid },
    update: { firstName, lastName },
    create: {
      utorid,
      firstName,
      lastName,
      email: `${utorid}@mail.utoronto.ca`,
    },
  });
}

async function ensureMember(
  userId: number,
  offeringId: number,
  role: "INSTRUCTOR" | "TA" | "STUDENT",
) {
  await prisma.offeringMember.upsert({
    where: { userId_offeringId: { userId, offeringId } },
    update: { role },
    create: { userId, offeringId, role },
  });
}

async function main() {
  console.log("Seeding DEBUGGING stats data...\n");

  // 1. CSC301H5 offering
  const offering = await prisma.courseOffering.findFirst({
    where: { course: { code: "CSC301H5" }, termCode: "20261" },
  });
  if (!offering)
    throw new Error("CSC301H5 offering not found — run seed-dev.ts first");

  // 2. Instructor + a TA host + students
  const prof = await ensureUser("prof01", "Prof", "One");
  await ensureMember(prof.id, offering.id, "INSTRUCTOR");
  console.log(`Instructor: utorid="prof01" (INSTRUCTOR in CSC301H5)`);

  const ta = await ensureUser("ta_max", "Max", "Tanaka");
  await ensureMember(ta.id, offering.id, "TA");

  const alice = await ensureUser("dev_alice", "Alice", "Chen");
  const bob = await ensureUser("dev_bob", "Bob", "Park");
  const carol = await ensureUser("dev_carol", "Carol", "Wu");
  const dave = await ensureUser("dev_dave", "Dave", "Kim");
  for (const s of [alice, bob, carol, dave]) {
    await ensureMember(s.id, offering.id, "STUDENT");
  }

  // ── Helper: create a session with hosts, records, and interests ───────────
  type Rec = {
    student: { id: number };
    host: "prof" | "ta" | null;
    waitMin: number | null;
    helpMin: number | null;
  };

  async function makeSession(
    title: string,
    startsAt: Date,
    status: "COMPLETED" | "SCHEDULED" | "ACTIVE",
    records: Rec[],
    interestedUserIds: number[],
  ) {
    const existing = await prisma.officeHourSession.findFirst({
      where: { offeringId: offering!.id, title, startsAt },
    });
    if (existing) {
      console.log(`Session "${title}" already exists — skipping`);
      return;
    }

    const session = await prisma.officeHourSession.create({
      data: {
        offeringId: offering!.id,
        title,
        type: "DEBUGGING",
        startsAt,
        endsAt: new Date(startsAt.getTime() + 2 * 60 * 60_000),
        location: "BA 3175",
        status,
      },
    });

    // Hosts: prof always hosts; TA hosts too on completed sessions
    const profHost = await prisma.officeHourSessionHost.create({
      data: { sessionId: session.id, userId: prof.id, role: "INSTRUCTOR" },
    });
    const taHost = await prisma.officeHourSessionHost.create({
      data: { sessionId: session.id, userId: ta.id, role: "TA" },
    });

    // Attendance records
    for (const r of records) {
      const checkedInAt = new Date(startsAt.getTime() + 5 * 60_000);
      const helpStartedAt =
        r.waitMin === null
          ? null
          : new Date(checkedInAt.getTime() + r.waitMin * 60_000);
      const helpEndedAt =
        helpStartedAt && r.helpMin !== null
          ? new Date(helpStartedAt.getTime() + r.helpMin * 60_000)
          : null;
      const hostId =
        r.host === "prof" ? profHost.id : r.host === "ta" ? taHost.id : null;

      await prisma.officeHourAttendanceRecord.create({
        data: {
          sessionId: session.id,
          studentId: r.student.id,
          checkedInAt,
          helpStartedAt,
          helpEndedAt,
          helpedByHostId: hostId,
          outcome: helpEndedAt ? "COMPLETED" : "NO_SHOW",
        },
      });
    }

    // Interests
    if (interestedUserIds.length > 0) {
      await prisma.officeHourInterest.createMany({
        data: interestedUserIds.map((userId) => ({
          sessionId: session.id,
          userId,
        })),
        skipDuplicates: true,
      });
    }

    console.log(
      `Created "${title}" [${status}] — ${records.length} records, ${interestedUserIds.length} interests`,
    );
  }

  // 3. Session A — completed, rich data + a repeat visitor (Alice ×2) + a no-show (Dave)
  await makeSession(
    "Debugging Queue (Mon)",
    daysAgo(3, 14),
    "COMPLETED",
    [
      { student: alice, host: "prof", waitMin: 5, helpMin: 15 },
      { student: alice, host: "ta", waitMin: 3, helpMin: 10 }, // 2nd visit → total help 25
      { student: bob, host: "ta", waitMin: 8, helpMin: 20 },
      { student: carol, host: "prof", waitMin: 2, helpMin: 5 },
      { student: dave, host: null, waitMin: null, helpMin: null }, // no-show → NA
    ],
    [alice.id, bob.id, carol.id, dave.id], // interested=4; alice/bob/carol/dave all checked in
  );

  // 4. Session B — completed, smaller
  await makeSession(
    "Debugging Queue (Wed)",
    daysAgo(1, 10),
    "COMPLETED",
    [
      { student: bob, host: "prof", waitMin: 10, helpMin: 30 },
      { student: carol, host: "ta", waitMin: 5, helpMin: 8 },
    ],
    [alice.id], // alice interested but did NOT come → interestedShowed=0
  );

  // 5. Session C — upcoming/scheduled → attendance metrics NA, interest only
  await makeSession(
    "Debugging Queue (Upcoming)",
    daysFromNow(2, 14),
    "SCHEDULED",
    [],
    [alice.id, bob.id, carol.id], // interested=3, rest NA
  );

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Done. To view:
  1. set DEV_UTORID=prof01 in .env
  2. visit /api/auth/session  (refresh the cookie)
  3. open /instructor/course-stats

Expected on overview:
  • Mon  → Checked in 4 · Got help 3 · Interested 4 · Interested&came 4
  • Wed  → Checked in 2 · Got help 2 · Interested 1 · Interested&came 0
  • Upcoming → Checked in NA · Got help NA · Interested 3 · NA

Click "Mon" details → Alice on top (25 min, 2 visits), then Bob, Carol, Dave (NA, no-show).
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
