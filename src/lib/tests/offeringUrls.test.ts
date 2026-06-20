/**
 * Tests: offering URL helpers
 *
 * How to run:
 *   pnpm dlx tsx src/lib/tests/offeringUrls.test.ts
 */

import "dotenv/config";

import {
  instructorDashboardHref,
  instructorRouteHref,
  withOfferingParam,
} from "@/lib/offeringUrls";
import { assertEqual, finishTests, runTest } from "./_seed";

async function main() {
  console.log("=== offeringUrls.test.ts ===\n");

  const offeringId = "clxyz123offering";

  await runTest("withOfferingParam appends offering query param", async () => {
    assertEqual(
      withOfferingParam("/instructor", offeringId),
      "/instructor?offering=clxyz123offering",
      "basic path",
    );
  });

  await runTest(
    "withOfferingParam preserves and overrides existing query params",
    async () => {
      assertEqual(
        withOfferingParam(
          "/instructor/schedule?weekStart=2026-01-05",
          offeringId,
        ),
        "/instructor/schedule?weekStart=2026-01-05&offering=clxyz123offering",
        "existing query preserved",
      );
    },
  );

  await runTest(
    "instructorDashboardHref targets instructor dashboard",
    async () => {
      assertEqual(
        instructorDashboardHref(offeringId),
        "/instructor?offering=clxyz123offering",
        "dashboard href",
      );
    },
  );

  await runTest(
    "instructorRouteHref includes offering and optional sessionId",
    async () => {
      assertEqual(
        instructorRouteHref("/instructor/my-queues/active", offeringId, {
          sessionId: "sess-abc",
        }),
        "/instructor/my-queues/active?offering=clxyz123offering&sessionId=sess-abc",
        "active queue href",
      );
    },
  );

  await finishTests();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
