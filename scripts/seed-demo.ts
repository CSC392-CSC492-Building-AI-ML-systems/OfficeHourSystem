/**
 * Minimal role seed: admin, instructor, TA, student, one shared course offering.
 *
 *   pnpm db:seed
 *
 * Log in by setting DEV_UTORID to one of the printed utorids, then hit
 * /api/auth/session. Admin (`testadmin`) is also listed in adminList.txt.
 */

import "dotenv/config";
import { prisma } from "@/lib/prisma";

const COURSE_CODE = "CSC108H5";
const TERM_CODE = "20265";

const ACCOUNTS = {
  admin: {
    utorid: "testadmin",
    firstName: "Ada",
    lastName: "Admin",
    isInstructor: false,
  },
  instructor: {
    utorid: "testinstructor",
    firstName: "Ivy",
    lastName: "Instructor",
    isInstructor: true,
  },
  ta: {
    utorid: "testta",
    firstName: "Terry",
    lastName: "TA",
    isInstructor: false,
  },
  student: {
    utorid: "teststudent",
    firstName: "Sam",
    lastName: "Student",
    isInstructor: false,
  },
} as const;

async function upsertUser(account: (typeof ACCOUNTS)[keyof typeof ACCOUNTS]) {
  return prisma.user.upsert({
    where: { utorid: account.utorid },
    update: {
      firstName: account.firstName,
      lastName: account.lastName,
      email: `${account.utorid}@mail.utoronto.ca`,
      isInstructor: account.isInstructor,
    },
    create: {
      utorid: account.utorid,
      firstName: account.firstName,
      lastName: account.lastName,
      email: `${account.utorid}@mail.utoronto.ca`,
      isInstructor: account.isInstructor,
    },
  });
}

async function main() {
  console.log("Seeding role demo accounts...\n");

  const admin = await upsertUser(ACCOUNTS.admin);
  const instructor = await upsertUser(ACCOUNTS.instructor);
  const ta = await upsertUser(ACCOUNTS.ta);
  const student = await upsertUser(ACCOUNTS.student);

  const course = await prisma.course.upsert({
    where: { code: COURSE_CODE },
    update: {},
    create: { code: COURSE_CODE },
  });

  const offering = await prisma.courseOffering.upsert({
    where: {
      courseId_termCode: { courseId: course.id, termCode: TERM_CODE },
    },
    update: {},
    create: { courseId: course.id, termCode: TERM_CODE },
  });

  const memberships = [
    { user: instructor, role: "INSTRUCTOR" as const },
    { user: ta, role: "TA" as const },
    { user: student, role: "STUDENT" as const },
  ];

  for (const { user, role } of memberships) {
    await prisma.offeringMember.upsert({
      where: {
        userId_offeringId: { userId: user.id, offeringId: offering.id },
      },
      update: { role },
      create: { userId: user.id, offeringId: offering.id, role },
    });
  }

  console.log(`Course: ${COURSE_CODE} · Term ${TERM_CODE}`);
  console.log(`Offering publicId: ${offering.publicId}\n`);
  console.log("Accounts (set DEV_UTORID then open /api/auth/session):");
  console.log(`  admin       ${admin.utorid}     (must be in adminList.txt)`);
  console.log(`  instructor  ${instructor.utorid}`);
  console.log(`  ta          ${ta.utorid}`);
  console.log(`  student     ${student.utorid}`);
  console.log("\nDone.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
