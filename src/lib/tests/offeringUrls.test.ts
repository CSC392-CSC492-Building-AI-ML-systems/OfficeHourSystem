/**
 * Tests: offering URL helpers
 *
 * How to run:
 *   pnpm dlx tsx src/lib/tests/offeringUrls.test.ts
 */

import "dotenv/config";

import {
  courseBasePath,
  courseInstructorSchedulePath,
  courseRouteHref,
  instructorDashboardHref,
  instructorRouteHref,
  studentDashboardHref,
} from "@/lib/offeringUrls";
import { assertEqual, finishTests, runTest } from "./_seed";

async function main() {
  console.log("=== offeringUrls.test.ts ===\n");

  const offeringPublicId = "clxyz123offering";

  await runTest("courseBasePath builds the course-scoped base", async () => {
    assertEqual(
      courseBasePath(offeringPublicId),
      "/course/clxyz123offering",
      "base path",
    );
  });

  await runTest("courseRouteHref prefixes the course-scoped base", async () => {
    assertEqual(
      courseRouteHref("/instructor", offeringPublicId),
      "/course/clxyz123offering/instructor",
      "basic path",
    );
  });

  await runTest("courseRouteHref preserves existing query params", async () => {
    assertEqual(
      courseRouteHref(
        "/instructor/schedule?weekStart=2026-01-05",
        offeringPublicId,
      ),
      "/course/clxyz123offering/instructor/schedule?weekStart=2026-01-05",
      "existing query preserved",
    );
  });

  await runTest(
    "instructorDashboardHref targets the course instructor dashboard",
    async () => {
      assertEqual(
        instructorDashboardHref(offeringPublicId),
        "/course/clxyz123offering/instructor",
        "dashboard href",
      );
    },
  );

  await runTest(
    "instructorRouteHref includes the course path and optional sessionId",
    async () => {
      assertEqual(
        instructorRouteHref("/instructor/my-queues/active", offeringPublicId, {
          sessionId: "sess-abc",
        }),
        "/course/clxyz123offering/instructor/my-queues/active?sessionId=sess-abc",
        "active queue href",
      );
    },
  );

  await runTest(
    "studentDashboardHref targets course student dashboard",
    async () => {
      assertEqual(
        studentDashboardHref(offeringPublicId),
        "/course/clxyz123offering/student",
        "student dashboard href",
      );
    },
  );

  await runTest(
    "courseInstructorSchedulePath builds revalidation path",
    async () => {
      assertEqual(
        courseInstructorSchedulePath(offeringPublicId),
        "/course/clxyz123offering/instructor/schedule",
        "schedule path",
      );
    },
  );

  await finishTests();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
