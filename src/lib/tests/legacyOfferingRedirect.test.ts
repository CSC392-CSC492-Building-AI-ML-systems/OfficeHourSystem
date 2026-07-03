/**
 * Tests: legacy offering URL redirect helper
 *
 * How to run:
 *   pnpm dlx tsx src/lib/tests/legacyOfferingRedirect.test.ts
 */

import "dotenv/config";

import { buildLegacyOfferingRedirectUrl } from "@/lib/legacyOfferingRedirect";
import { assertEqual, finishTests, runTest } from "./_seed";

async function main() {
  console.log("=== legacyOfferingRedirect.test.ts ===\n");

  await runTest(
    "buildLegacyOfferingRedirectUrl → course-scoped instructor dashboard",
    async () => {
      assertEqual(
        buildLegacyOfferingRedirectUrl({ offering: "abc123" }, "/instructor"),
        "/course/abc123/instructor",
        "redirect target",
      );
    },
  );

  await runTest(
    "buildLegacyOfferingRedirectUrl → preserves sessionId query param",
    async () => {
      assertEqual(
        buildLegacyOfferingRedirectUrl(
          { offering: "abc123", sessionId: "sess-1" },
          "/instructor/scan",
        ),
        "/course/abc123/instructor/scan?sessionId=sess-1",
        "redirect target",
      );
    },
  );

  await runTest(
    "buildLegacyOfferingRedirectUrl → null without offering param",
    async () => {
      assertEqual(
        buildLegacyOfferingRedirectUrl({}, "/instructor"),
        null,
        "missing offering",
      );
    },
  );

  await finishTests();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
