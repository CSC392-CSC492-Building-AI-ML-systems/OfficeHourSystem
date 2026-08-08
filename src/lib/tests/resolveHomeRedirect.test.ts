/**
 * Tests: post-login redirect + workspace URL helpers
 *
 * How to run:
 *   pnpm dlx tsx src/lib/tests/resolveHomeRedirect.test.ts
 */

import "dotenv/config";

import {
  resolveHomeRedirectPath,
  roleLabelForRole,
  workspaceHrefForRole,
  workspaceLabelForRole,
} from "@/lib/auth/resolveHomeRedirect";
import {
  instructorDashboardHref,
  studentDashboardHref,
} from "@/lib/offeringUrls";
import { prisma } from "@/lib/prisma";
import {
  TEST_PREFIX,
  TEST_TERM,
  cleanupAll,
  assertEqual,
  runTest,
  finishTests,
} from "./_seed";

async function main() {
  console.log("=== resolveHomeRedirect.test.ts ===\n");

  await cleanupAll();

  const platformInstructor = await prisma.user.create({
    data: {
      utorid: `${TEST_PREFIX}home_instructor`,
      isInstructor: true,
    },
  });
  const student = await prisma.user.create({
    data: { utorid: `${TEST_PREFIX}home_student` },
  });

  await runTest(
    "workspaceHrefForRole → instructor and student destinations",
    async () => {
      const offeringId = "abc123";
      assertEqual(
        workspaceHrefForRole("INSTRUCTOR", offeringId),
        instructorDashboardHref(offeringId),
        "instructor href",
      );
      assertEqual(
        workspaceHrefForRole("TA", offeringId),
        instructorDashboardHref(offeringId),
        "TA href",
      );
      assertEqual(
        workspaceHrefForRole("STUDENT", offeringId),
        studentDashboardHref(offeringId),
        "student href",
      );
      assertEqual(workspaceHrefForRole(null, offeringId), null, "no role href");
    },
  );

  await runTest(
    "role and workspace labels reflect membership role",
    async () => {
      assertEqual(
        roleLabelForRole("INSTRUCTOR"),
        "Instructor",
        "instructor label",
      );
      assertEqual(
        workspaceLabelForRole("STUDENT"),
        "Open student dashboard",
        "student workspace label",
      );
    },
  );

  await runTest(
    "resolveHomeRedirectPath → instructor view for instructors, student portal for students",
    async () => {
      assertEqual(
        await resolveHomeRedirectPath(
          platformInstructor.id,
          platformInstructor.utorid,
        ),
        "/course",
        "instructor home",
      );
      assertEqual(
        await resolveHomeRedirectPath(student.id, student.utorid),
        "/student",
        "student home",
      );
    },
  );

  await cleanupAll();
  await finishTests();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
