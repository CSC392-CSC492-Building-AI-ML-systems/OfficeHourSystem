/**
 * Record an office hour interest via recordSessionInterest().
 *
 * Usage:
 *   npx tsx scripts/record-interest.ts <userId> <sessionId>
 *
 * Prerequisite:
 *   DATABASE_URL configured in .env
 *
 * The recordInterest() server action derives userId from the request
 * session, which isn't available outside the browser. This script calls the
 * underlying recordSessionInterest() directly with an explicit userId so you
 * can test the logic locally without an auth cookie.
 */

import "dotenv/config";

async function main() {
  const userId = Number(process.argv[2]);
  const sessionId = Number(process.argv[3]);

  if (!Number.isInteger(userId) || !Number.isInteger(sessionId)) {
    console.error(
      "Usage: npx tsx scripts/record-interest.ts <userId> <sessionId>",
    );
    process.exit(1);
  }

  if (process.env.NODE_ENV === "production") {
    console.error("This script is for local development only.");
    process.exit(1);
  }

  const { recordSessionInterest } = await import("../src/lib/ohInterests");

  const result = await recordSessionInterest(userId, sessionId);

  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
