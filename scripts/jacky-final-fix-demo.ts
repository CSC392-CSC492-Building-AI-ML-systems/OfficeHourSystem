import "dotenv/config";

import { prisma } from "@/lib/prisma";
import { getHomeHeroStatsForUser } from "@/lib/queries/home_stats/home-stats";
import { getInterestedSessionsForStudent } from "@/lib/queries/student_interest/student-interest";

const USER_UTORIDS = [
  "jacky_final_student",
  "jacky_final_guest",
  "jacky_final_ta",
] as const;
const COURSE_CODE = "JFX101";
const TERM_CODE = "20991";
const SESSION_PUBLIC_IDS = [
  "jacky-final-upcoming-1",
  "jacky-final-upcoming-2",
  "jacky-final-interested-later",
  "jacky-final-student-active-queue",
  "jacky-final-staff-upcoming",
  "jacky-final-staff-active-queue",
] as const;

function offsetFrom(date: Date, days: number, hours = 0) {
  return new Date(
    date.getTime() + days * 24 * 60 * 60 * 1000 + hours * 60 * 60 * 1000,
  );
}

async function cleanup() {
  await prisma.$transaction(async (tx) => {
    const users = await tx.user.findMany({
      where: { utorid: { in: [...USER_UTORIDS] } },
      select: { id: true },
    });
    const userIds = users.map((user) => user.id);
    const sessions = await tx.officeHourSession.findMany({
      where: { publicId: { in: [...SESSION_PUBLIC_IDS] } },
      select: { id: true },
    });
    const sessionIds = sessions.map((session) => session.id);

    await tx.officeHourAttendance.deleteMany({
      where: {
        OR: [{ sessionId: { in: sessionIds } }, { studentId: { in: userIds } }],
      },
    });
    await tx.officeHourAttendanceRecord.deleteMany({
      where: {
        OR: [{ sessionId: { in: sessionIds } }, { studentId: { in: userIds } }],
      },
    });
    await tx.officeHourInterest.deleteMany({
      where: {
        OR: [{ sessionId: { in: sessionIds } }, { userId: { in: userIds } }],
      },
    });
    await tx.officeHourSessionHost.deleteMany({
      where: {
        OR: [{ sessionId: { in: sessionIds } }, { userId: { in: userIds } }],
      },
    });
    await tx.officeHourSession.deleteMany({
      where: { id: { in: sessionIds } },
    });

    const course = await tx.course.findUnique({
      where: { code: COURSE_CODE },
      select: { id: true },
    });
    if (course) {
      const offerings = await tx.courseOffering.findMany({
        where: { courseId: course.id, termCode: TERM_CODE },
        select: { id: true },
      });
      const offeringIds = offerings.map((offering) => offering.id);
      await tx.offeringMember.deleteMany({
        where: { offeringId: { in: offeringIds } },
      });
      await tx.courseOffering.deleteMany({
        where: { id: { in: offeringIds } },
      });
      await tx.course.delete({ where: { id: course.id } });
    }

    await tx.user.deleteMany({ where: { id: { in: userIds } } });
  });

  console.log("Removed Jacky final-fix demo fixtures.");
}

async function seed() {
  const now = new Date();
  await cleanup();

  const result = await prisma.$transaction(async (tx) => {
    const student = await tx.user.create({
      data: {
        utorid: USER_UTORIDS[0],
        firstName: "Jacky",
        lastName: "Demo Student",
        email: "jacky_final_student@example.test",
      },
    });
    const guest = await tx.user.create({
      data: {
        utorid: USER_UTORIDS[1],
        firstName: "Demo",
        lastName: "Guest",
        email: "jacky_final_guest@example.test",
      },
    });
    const ta = await tx.user.create({
      data: {
        utorid: USER_UTORIDS[2],
        firstName: "Jacky",
        lastName: "Demo TA",
        email: "jacky_final_ta@example.test",
      },
    });
    const course = await tx.course.create({ data: { code: COURSE_CODE } });
    const offering = await tx.courseOffering.create({
      data: { courseId: course.id, termCode: TERM_CODE },
    });

    await tx.offeringMember.createMany({
      data: [
        { userId: student.id, offeringId: offering.id, role: "STUDENT" },
        { userId: guest.id, offeringId: offering.id, role: "STUDENT" },
        { userId: ta.id, offeringId: offering.id, role: "TA" },
      ],
    });

    const createSession = (
      publicId: (typeof SESSION_PUBLIC_IDS)[number],
      title: string,
      startsAt: Date,
      endsAt: Date,
      status: "SCHEDULED" | "ACTIVE",
    ) =>
      tx.officeHourSession.create({
        data: {
          publicId,
          offeringId: offering.id,
          title,
          type: "DEBUGGING",
          startsAt,
          endsAt,
          location: "DH 2014 — Jacky demo",
          status,
        },
      });

    const upcoming1 = await createSession(
      SESSION_PUBLIC_IDS[0],
      "Jacky Demo — Tomorrow Help Centre",
      offsetFrom(now, 1),
      offsetFrom(now, 1, 1),
      "SCHEDULED",
    );
    await createSession(
      SESSION_PUBLIC_IDS[1],
      "Jacky Demo — Next Week Help Centre",
      offsetFrom(now, 7),
      offsetFrom(now, 7, 1),
      "SCHEDULED",
    );
    const later = await createSession(
      SESSION_PUBLIC_IDS[2],
      "Jacky Demo — Interested Beyond 14 Days",
      offsetFrom(now, 21),
      offsetFrom(now, 21, 1),
      "SCHEDULED",
    );
    const studentQueue = await createSession(
      SESSION_PUBLIC_IDS[3],
      "Jacky Demo — Student Active Queue",
      offsetFrom(now, 0, -1),
      offsetFrom(now, 0, 1),
      "ACTIVE",
    );
    const staffUpcoming = await createSession(
      SESSION_PUBLIC_IDS[4],
      "Jacky Demo — TA Hosted Upcoming",
      offsetFrom(now, 2),
      offsetFrom(now, 2, 1),
      "SCHEDULED",
    );
    const staffActive = await createSession(
      SESSION_PUBLIC_IDS[5],
      "Jacky Demo — TA Hosted Active Queue",
      offsetFrom(now, 0, -1),
      offsetFrom(now, 0, 1),
      "ACTIVE",
    );

    await tx.officeHourSessionHost.createMany({
      data: [
        { sessionId: staffUpcoming.id, userId: ta.id, role: "TA" },
        { sessionId: staffActive.id, userId: ta.id, role: "TA" },
      ],
    });
    await tx.officeHourInterest.createMany({
      data: [
        { userId: student.id, sessionId: upcoming1.id },
        { userId: student.id, sessionId: later.id },
        { userId: student.id, sessionId: staffUpcoming.id },
        { userId: guest.id, sessionId: staffUpcoming.id },
      ],
    });
    await tx.officeHourAttendance.createMany({
      data: [
        {
          publicId: "jacky-final-student-waiting",
          sessionId: studentQueue.id,
          studentId: student.id,
          checkedInAt: offsetFrom(now, 0, -0.25),
          status: "WAITING",
        },
        {
          publicId: "jacky-final-staff-waiting",
          sessionId: staffActive.id,
          studentId: guest.id,
          checkedInAt: offsetFrom(now, 0, -0.2),
          status: "WAITING",
        },
      ],
    });

    return {
      studentUtorid: student.utorid,
      staffUtorid: ta.utorid,
      course: course.code,
      offeringPublicId: offering.publicId,
    };
  });

  console.log(JSON.stringify(result, null, 2));
  console.log("Expected student hero: Upcoming 3, Interested 3, My Queue 1");
  console.log("Expected staff hero: Hosted 1, Interest Presses 2, Waiting 1");
}

async function verify() {
  const student = await prisma.user.findUniqueOrThrow({
    where: { utorid: USER_UTORIDS[0] },
  });
  const staff = await prisma.user.findUniqueOrThrow({
    where: { utorid: USER_UTORIDS[2] },
  });
  const [studentHero, staffHero, interestedSessions] = await Promise.all([
    getHomeHeroStatsForUser(student.id, false),
    getHomeHeroStatsForUser(staff.id, false),
    getInterestedSessionsForStudent(student.id),
  ]);

  console.log(
    JSON.stringify(
      {
        studentHero,
        staffHero,
        interestedTitles: interestedSessions.map((session) => session.title),
      },
      null,
      2,
    ),
  );
}

async function main() {
  const shouldCleanup = process.argv.includes("--cleanup");
  const shouldVerify = process.argv.includes("--verify");
  try {
    if (shouldCleanup) await cleanup();
    else if (shouldVerify) await verify();
    else await seed();
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
