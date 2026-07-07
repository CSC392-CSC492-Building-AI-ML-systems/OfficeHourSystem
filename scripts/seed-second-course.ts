/**
 * Dev seed script: add a SECOND course offering and make the DEV user TA there too,
 * with an OH session happening today — for testing the multi-course Upcoming OH view.
 *
 * How to run:
 *   npx tsx scripts/seed-second-course.ts
 *
 * Prerequisite: run scripts/seed-dev.ts first (creates the DEV user + CSC301H5 offering)
 *
 * Safe to run multiple times — uses upsert so it won't create duplicates.
 */

import "dotenv/config";
import { prisma } from "@/lib/prisma";

async function main() {
  console.log("Seeding second course for DEV user...\n");

  // Step 1: Get the DEV user
  const devUser = await prisma.user.findUnique({ where: { utorid: "test" } });
  if (!devUser) {
    throw new Error("DEV user not found — run scripts/seed-dev.ts first");
  }
  console.log(`DEV user: id=${devUser.id}, utorid=${devUser.utorid}`);

  // Step 2: Upsert a second course
  const course = await prisma.course.upsert({
    where: { code: "CSC358H5" },
    update: {},
    create: { code: "CSC358H5" },
  });
  console.log(`Course: id=${course.id}, code=${course.code}`);

  // Step 3: Upsert an offering for this course (same term as seed-dev.ts)
  const offering = await prisma.courseOffering.upsert({
    where: {
      courseId_termCode: {
        courseId: course.id,
        termCode: "20261",
      },
    },
    update: {},
    create: {
      courseId: course.id,
      termCode: "20261",
    },
  });
  console.log(`Offering: id=${offering.id}, term=${offering.termCode}`);

  // Step 4: Add DEV user as TA in this second offering
  await prisma.offeringMember.upsert({
    where: {
      userId_offeringId: {
        userId: devUser.id,
        offeringId: offering.id,
      },
    },
    update: { role: "TA" },
    create: {
      userId: devUser.id,
      offeringId: offering.id,
      role: "TA",
    },
  });
  console.log(`Added DEV user as TA to offering ${offering.id}`);

  // Step 5: Create a session happening today
  const today = new Date();
  const start = new Date(today);
  start.setHours(12, 0, 0, 0); // 12:00 PM
  const end = new Date(today);
  end.setHours(13, 0, 0, 0); // 1:00 PM

  let session = await prisma.officeHourSession.findFirst({
    where: { offeringId: offering.id, startsAt: start },
  });

  if (session) {
    console.log(`Session already exists for ${course.code} — skipping`);
  } else {
    session = await prisma.officeHourSession.create({
      data: {
        offeringId: offering.id,
        title: "Office Hours",
        type: "REGULAR",
        startsAt: start,
        endsAt: end,
        location: "DH 2014",
        status: "SCHEDULED",
      },
    });
    console.log(
      `Created session: "${session.title}" at ${session.startsAt.toLocaleTimeString()}`,
    );
  }

  // Register the DEV user as a host so they can run this session (a TA must be
  // a session host under the new queue auth rules).
  await prisma.officeHourSessionHost.upsert({
    where: { sessionId_userId: { sessionId: session.id, userId: devUser.id } },
    update: {},
    create: { sessionId: session.id, userId: devUser.id, role: "TA" },
  });

  console.log(
    "\nDone. DEV user is now TA in both CSC301H5 and CSC358H5 — go to /instructor/my-queues",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
