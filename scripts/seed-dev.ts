/**
 * Dev seed script: insert today's OH sessions and wire up the DEV user as TA.
 *
 * How to run:
 *   npx tsx scripts/seed-dev.ts
 *
 * What it does:
 *   1. Upsert the DEV user (utorid = "test")
 *   2. Upsert a test course + offering
 *   3. Add the DEV user to the offering as TA
 *   4. Create 3 OH sessions happening today
 *   5. Create 5 fake students enrolled in the offering
 *   6. Add 3 students as WAITING and 1 as IN_HELP in the Debugging Queue session
 *
 * Safe to run multiple times — uses upsert so it won't create duplicates.
 */

import "dotenv/config";
import { prisma } from "@/lib/prisma";

async function main() {
  console.log("Seeding dev data...\n");

  // Step 1: Upsert the DEV user
  const devUser = await prisma.user.upsert({
    where: { utorid: "test" },
    update: {
      firstName: "firsts",
      lastName: "last",
      email: "test@mail.utoronto.ca",
    },
    create: {
      utorid: "test",
      firstName: "firsts",
      lastName: "last",
      email: "test@mail.utoronto.ca",
    },
  });
  console.log(`DEV user: id=${devUser.id}, utorid=${devUser.utorid}`);

  // Step 2: Upsert a test course
  const course = await prisma.course.upsert({
    where: { code: "CSC301H5" },
    update: {},
    create: { code: "CSC301H5" },
  });
  console.log(`Course: id=${course.id}, code=${course.code}`);

  // Step 3: Upsert a test offering (term code = current term)
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

  // Step 4: Add DEV user as TA in this offering
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

  // Step 5: Create 3 sessions happening today
  const today = new Date();

  // Session 1: 10:00 AM - 11:00 AM, REGULAR
  const s1Start = new Date(today);
  s1Start.setHours(10, 0, 0, 0);
  const s1End = new Date(today);
  s1End.setHours(11, 0, 0, 0);

  // Session 2: 2:00 PM - 3:00 PM, DEBUGGING
  const s2Start = new Date(today);
  s2Start.setHours(14, 0, 0, 0);
  const s2End = new Date(today);
  s2End.setHours(15, 0, 0, 0);

  // Session 3: 4:00 PM - 5:00 PM, GROUP
  const s3Start = new Date(today);
  s3Start.setHours(16, 0, 0, 0);
  const s3End = new Date(today);
  s3End.setHours(17, 0, 0, 0);

  const sessions = [
    {
      title: "Morning Drop-in",
      type: "REGULAR" as const,
      startsAt: s1Start,
      endsAt: s1End,
      location: "BA 3110",
      status: "SCHEDULED" as const,
    },
    {
      title: "Debugging Queue",
      type: "DEBUGGING" as const,
      startsAt: s2Start,
      endsAt: s2End,
      location: "Online (Zoom)",
      status: "ACTIVE" as const,
    },
    {
      title: "Group Topic Session",
      type: "GROUP" as const,
      startsAt: s3Start,
      endsAt: s3End,
      location: "BA 2270",
      status: "SCHEDULED" as const,
    },
  ];

  for (const s of sessions) {
    // Check if session already exists (same offering + startsAt)
    let session = await prisma.officeHourSession.findFirst({
      where: { offeringId: offering.id, startsAt: s.startsAt },
    });

    if (session) {
      console.log(`Session already exists: "${s.title}" — skipping`);
    } else {
      session = await prisma.officeHourSession.create({
        data: { offeringId: offering.id, ...s },
      });
      console.log(
        `Created session: "${session.title}" at ${session.startsAt.toLocaleTimeString()}`,
      );
    }

    // Register the DEV user as a host — a TA must be a session host to run the
    // queue under the new auth rules.
    await prisma.officeHourSessionHost.upsert({
      where: {
        sessionId_userId: { sessionId: session.id, userId: devUser.id },
      },
      update: {},
      create: { sessionId: session.id, userId: devUser.id, role: "TA" },
    });
  }

  // Step 6: Find the Debugging Queue session to add fake students to it
  const debugSession = await prisma.officeHourSession.findFirst({
    where: { offeringId: offering.id, type: "DEBUGGING" },
  });

  if (!debugSession) {
    console.log("Debugging session not found, skipping student seed");
  } else {
    // Define 4 fake students: 3 WAITING, 1 IN_HELP
    const fakeStudents = [
      {
        utorid: "dev_alice",
        firstName: "Alice",
        lastName: "Chen",
        status: "WAITING" as const,
        minutesAgo: 30,
      },
      {
        utorid: "dev_bob",
        firstName: "Bob",
        lastName: "Park",
        status: "WAITING" as const,
        minutesAgo: 20,
      },
      {
        utorid: "dev_carol",
        firstName: "Carol",
        lastName: "Wu",
        status: "WAITING" as const,
        minutesAgo: 10,
      },
      {
        utorid: "dev_dave",
        firstName: "Dave",
        lastName: "Kim",
        status: "IN_HELP" as const,
        minutesAgo: 5,
      },
    ];

    for (const s of fakeStudents) {
      // Upsert the student user
      const student = await prisma.user.upsert({
        where: { utorid: s.utorid },
        update: { firstName: s.firstName, lastName: s.lastName },
        create: {
          utorid: s.utorid,
          firstName: s.firstName,
          lastName: s.lastName,
          email: `${s.utorid}@mail.utoronto.ca`,
        },
      });

      // Enroll student in offering
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

      // Add attendance record — skip if already exists
      const existingAttendance = await prisma.officeHourAttendance.findFirst({
        where: { sessionId: debugSession.id, studentId: student.id },
      });

      if (existingAttendance) {
        console.log(`Attendance already exists for ${s.firstName} — skipping`);
        continue;
      }

      const checkedInAt = new Date(Date.now() - s.minutesAgo * 60 * 1000);
      await prisma.officeHourAttendance.create({
        data: {
          sessionId: debugSession.id,
          studentId: student.id,
          status: s.status,
          checkedInAt,
        },
      });

      console.log(`Added ${s.firstName} ${s.lastName} as ${s.status}`);
    }
  }

  // Step 7: Add two real-card dummy students, enrolled as STUDENT in EVERY offering.
  // Their studentNumber / utorid / barcode match real TCard swipe data so the
  // scan flow can be tested end-to-end.
  const cardStudents = [
    {
      firstName: "Jingcheng",
      lastName: "Liang",
      studentNumber: "1011097965",
      utorid: "liang696",
      barcode: "2176102914868302",
    },
    {
      firstName: "Jacky",
      lastName: "Huo",
      studentNumber: "1011661168",
      utorid: "huohaozh",
      barcode: "2176103009687101",
    },
  ];

  // Enroll them in ALL offerings (not just the test one)
  const allOfferings = await prisma.courseOffering.findMany({
    select: { id: true },
  });

  for (const s of cardStudents) {
    const student = await prisma.user.upsert({
      where: { utorid: s.utorid },
      update: {
        firstName: s.firstName,
        lastName: s.lastName,
        studentNumber: s.studentNumber,
      },
      create: {
        utorid: s.utorid,
        firstName: s.firstName,
        lastName: s.lastName,
        studentNumber: s.studentNumber,
        email: `${s.utorid}@mail.utoronto.ca`,
      },
    });

    for (const o of allOfferings) {
      await prisma.offeringMember.upsert({
        where: { userId_offeringId: { userId: student.id, offeringId: o.id } },
        update: { role: "STUDENT" },
        create: { userId: student.id, offeringId: o.id, role: "STUDENT" },
      });
    }

    console.log(
      `Enrolled ${s.firstName} ${s.lastName} (sn=${s.studentNumber}, utorid=${s.utorid}) as STUDENT in ${allOfferings.length} offering(s)`,
    );
  }

  console.log("\nDone. Run npm run dev and go to /instructor/my-queues");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
