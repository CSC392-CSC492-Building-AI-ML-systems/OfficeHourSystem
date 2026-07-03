/**
 * Dev seed script: create MANY office-hour sessions for the My Queue view,
 * each with a populated live queue (students WAITING + some IN_HELP).
 *
 * How to run:
 *   npx tsx scripts/seed-queue-extra.ts
 *
 * Prerequisite: run scripts/seed-dev.ts first (creates the DEV user "test"
 * + the CSC301H5 / term 20261 offering). This script reuses them.
 *
 * What it does:
 *   1. Reuse the DEV user (utorid "test") and the CSC301H5 / 20261 offering,
 *      making sure the DEV user is a TA member.
 *   2. Create 10 ACTIVE sessions happening today (staggered start times) so
 *      they all show up in Upcoming OH and can be opened as live queues.
 *   3. Register the DEV user as an OfficeHourSessionHost on every session
 *      (used for helpedByHostId attribution).
 *   4. Enroll a fresh pool of fake students per session and put them in the
 *      queue: several WAITING + a couple IN_HELP (IN_HELP rows get
 *      helpedByHostId pointing at the DEV host).
 *
 * Safe to run multiple times — every write is upsert / find-then-skip.
 */

import "dotenv/config";
import { prisma } from "@/lib/prisma";
import type { OfficeHourType } from "@prisma/client";

const SESSION_COUNT = 10;
const WAITING_PER_SESSION = 5;
const IN_HELP_PER_SESSION = 2;

const TYPES: OfficeHourType[] = ["REGULAR", "DEBUGGING", "GROUP"];
const LOCATIONS = [
  "BA 3110",
  "Online (Zoom)",
  "BA 2270",
  "DH 2014",
  "IB 345",
  "MN 1210",
  "Online (Teams)",
  "BA 1180",
  "DH 2020",
  "IB 360",
];

const FIRST_NAMES = [
  "Alice",
  "Bob",
  "Carol",
  "Dave",
  "Eve",
  "Frank",
  "Grace",
  "Heidi",
  "Ivan",
  "Judy",
  "Mallory",
  "Niaj",
  "Olivia",
  "Peggy",
  "Rupert",
  "Sybil",
  "Trent",
  "Victor",
  "Walter",
  "Yvonne",
];
const LAST_NAMES = [
  "Chen",
  "Park",
  "Wu",
  "Kim",
  "Singh",
  "Patel",
  "Garcia",
  "Lee",
  "Nguyen",
  "Brown",
  "Khan",
  "Lopez",
  "Wang",
  "Davis",
  "Ali",
];

function makeName(seed: number) {
  return {
    firstName: FIRST_NAMES[seed % FIRST_NAMES.length],
    lastName: LAST_NAMES[(seed * 7) % LAST_NAMES.length],
  };
}

async function main() {
  console.log("Seeding extra My Queue sessions...\n");

  // Step 1: Reuse the DEV user + CSC301H5 / 20261 offering
  const devUser = await prisma.user.findUnique({ where: { utorid: "test" } });
  if (!devUser) {
    throw new Error(
      'DEV user "test" not found — run scripts/seed-dev.ts first',
    );
  }

  const course = await prisma.course.findUnique({
    where: { code: "CSC301H5" },
  });
  if (!course) {
    throw new Error(
      "Course CSC301H5 not found — run scripts/seed-dev.ts first",
    );
  }

  const offering = await prisma.courseOffering.findUnique({
    where: { courseId_termCode: { courseId: course.id, termCode: "20261" } },
  });
  if (!offering) {
    throw new Error(
      "Offering CSC301H5/20261 not found — run scripts/seed-dev.ts first",
    );
  }
  console.log(
    `Offering: id=${offering.id} (${course.code} / ${offering.termCode})`,
  );

  // Make sure the DEV user is a TA in this offering
  await prisma.offeringMember.upsert({
    where: {
      userId_offeringId: { userId: devUser.id, offeringId: offering.id },
    },
    update: { role: "TA" },
    create: { userId: devUser.id, offeringId: offering.id, role: "TA" },
  });

  // Step 2-4: create sessions + hosts + queues
  let studentSeed = 0;

  for (let i = 0; i < SESSION_COUNT; i++) {
    // Staggered start time today: 9:00, 9:30, 10:00, ... within today's range
    const startsAt = new Date();
    startsAt.setHours(9, 0, 0, 0);
    startsAt.setMinutes(startsAt.getMinutes() + i * 30);
    const endsAt = new Date(startsAt);
    endsAt.setMinutes(endsAt.getMinutes() + 30);

    const type = TYPES[i % TYPES.length];
    const title = `Queue Session ${i + 1} (${type})`;

    // Idempotent: one session per (offering, startsAt)
    let session = await prisma.officeHourSession.findFirst({
      where: { offeringId: offering.id, startsAt },
    });
    if (!session) {
      session = await prisma.officeHourSession.create({
        data: {
          offeringId: offering.id,
          title,
          type,
          startsAt,
          endsAt,
          location: LOCATIONS[i % LOCATIONS.length],
          status: "ACTIVE",
        },
      });
      console.log(
        `\nCreated session "${session.title}" @ ${startsAt.toLocaleTimeString()}`,
      );
    } else {
      console.log(`\nSession "${session.title}" already exists — reusing`);
    }

    // Step 3: DEV user as OfficeHourSessionHost for this session
    const host = await prisma.officeHourSessionHost.upsert({
      where: {
        sessionId_userId: { sessionId: session.id, userId: devUser.id },
      },
      update: { role: "TA" },
      create: { sessionId: session.id, userId: devUser.id, role: "TA" },
    });

    // Step 4: build the live queue
    const total = WAITING_PER_SESSION + IN_HELP_PER_SESSION;
    for (let j = 0; j < total; j++) {
      studentSeed++;
      const utorid = `qstu${String(studentSeed).padStart(3, "0")}`;
      const { firstName, lastName } = makeName(studentSeed);

      const student = await prisma.user.upsert({
        where: { utorid },
        update: { firstName, lastName },
        create: {
          utorid,
          firstName,
          lastName,
          email: `${utorid}@mail.utoronto.ca`,
        },
      });

      await prisma.offeringMember.upsert({
        where: {
          userId_offeringId: { userId: student.id, offeringId: offering.id },
        },
        update: {},
        create: {
          userId: student.id,
          offeringId: offering.id,
          role: "STUDENT",
        },
      });

      const existing = await prisma.officeHourAttendance.findFirst({
        where: { sessionId: session.id, studentId: student.id },
      });
      if (existing) continue;

      const isInHelp = j >= WAITING_PER_SESSION;
      // Earlier joiners checked in longer ago (lower j == earlier in line)
      const checkedInAt = new Date(Date.now() - (total - j) * 6 * 60 * 1000);

      await prisma.officeHourAttendance.create({
        data: {
          sessionId: session.id,
          studentId: student.id,
          status: isInHelp ? "IN_HELP" : "WAITING",
          checkedInAt,
          helpStartedAt: isInHelp ? new Date(Date.now() - 3 * 60 * 1000) : null,
          helpedByHostId: isInHelp ? host.id : null,
        },
      });
    }

    console.log(
      `  queue: ${WAITING_PER_SESSION} WAITING + ${IN_HELP_PER_SESSION} IN_HELP`,
    );
  }

  console.log(
    `\nDone. Created/ensured ${SESSION_COUNT} sessions, each with ` +
      `${WAITING_PER_SESSION} waiting + ${IN_HELP_PER_SESSION} in-help. ` +
      `Run npm run dev and open /instructor/my-queues`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
