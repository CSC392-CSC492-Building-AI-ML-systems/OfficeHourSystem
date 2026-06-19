/**
 * Tests: startSession()
 *
 * How to run:
 *   pnpm dlx tsx src/lib/tests/start_session/start-session.test.ts
 *
 * Scenarios covered:
 *   1. SCHEDULED session → transitions to ACTIVE, returns "started"
 *   2. DELAYED session → transitions to ACTIVE, returns "started"
 *   3. Already ACTIVE session → returns "already_active", status unchanged
 *   4. COMPLETED session → returns "invalid_state", status unchanged
 *   5. Concurrent start: two calls on the same SCHEDULED session → only one gets "started"
 */

import "dotenv/config";

import { prisma } from "@/lib/prisma";
import { startSession } from "@/lib/queries/start_session/start-session";
import {
  TEST_PREFIX,
  TEST_TERM,
  cleanupAll,
  assert,
  assertEqual,
  runTest,
  finishTests,
} from "../_seed";

// ── Helpers ───────────────────────────────────────────────────────────────────

async function setupOffering() {
  const course = await prisma.course.create({
    data: { code: `${TEST_PREFIX}STARTSESS101` },
  });
  const offering = await prisma.courseOffering.create({
    data: { courseId: course.id, termCode: TEST_TERM },
  });
  return { offering };
}

async function createSession(
  offeringId: number,
  status: "SCHEDULED" | "DELAYED" | "ACTIVE" | "COMPLETED" | "CANCELLED",
) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(10, 0, 0, 0);
  const end = new Date(now);
  end.setHours(11, 0, 0, 0);
  return prisma.officeHourSession.create({
    data: {
      offeringId,
      title: "Test Session",
      type: "REGULAR",
      startsAt: start,
      endsAt: end,
      status,
    },
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== start-session.test.ts ===\n");

  await cleanupAll();

  // ── Test 1: SCHEDULED → ACTIVE ────────────────────────────────────────────
  await runTest(
    "SCHEDULED session → transitions to ACTIVE, returns 'started'",
    async () => {
      await cleanupAll();
      const { offering } = await setupOffering();
      const session = await createSession(offering.id, "SCHEDULED");

      const result = await startSession(session.id);

      assertEqual(result, "started", "should return 'started'");

      const updated = await prisma.officeHourSession.findUnique({
        where: { id: session.id },
      });
      assertEqual(updated?.status, "ACTIVE", "status should be ACTIVE");
    },
  );

  // ── Test 2: DELAYED → ACTIVE ──────────────────────────────────────────────
  await runTest(
    "DELAYED session → transitions to ACTIVE, returns 'started'",
    async () => {
      await cleanupAll();
      const { offering } = await setupOffering();
      const session = await createSession(offering.id, "DELAYED");

      const result = await startSession(session.id);

      assertEqual(result, "started", "should return 'started'");

      const updated = await prisma.officeHourSession.findUnique({
        where: { id: session.id },
      });
      assertEqual(updated?.status, "ACTIVE", "status should be ACTIVE");
    },
  );

  // ── Test 3: Already ACTIVE → returns "already_active", no change ─────────
  await runTest(
    "Already ACTIVE session → returns 'already_active', status unchanged",
    async () => {
      await cleanupAll();
      const { offering } = await setupOffering();
      const session = await createSession(offering.id, "ACTIVE");

      const result = await startSession(session.id);

      assertEqual(result, "already_active", "should return 'already_active'");

      const unchanged = await prisma.officeHourSession.findUnique({
        where: { id: session.id },
      });
      assertEqual(unchanged?.status, "ACTIVE", "status should still be ACTIVE");
    },
  );

  // ── Test 4: COMPLETED session → returns "invalid_state" ──────────────────
  await runTest(
    "COMPLETED session → returns 'invalid_state', status unchanged",
    async () => {
      await cleanupAll();
      const { offering } = await setupOffering();
      const session = await createSession(offering.id, "COMPLETED");

      const result = await startSession(session.id);

      assertEqual(result, "invalid_state", "should return 'invalid_state'");

      const unchanged = await prisma.officeHourSession.findUnique({
        where: { id: session.id },
      });
      assertEqual(
        unchanged?.status,
        "COMPLETED",
        "status should still be COMPLETED",
      );
    },
  );

  // ── Test 5: Concurrent start — only one call wins ─────────────────────────
  await runTest(
    "Two concurrent startSession calls → only one returns 'started'",
    async () => {
      await cleanupAll();
      const { offering } = await setupOffering();
      const session = await createSession(offering.id, "SCHEDULED");

      // Fire both at the same time
      const [r1, r2] = await Promise.all([
        startSession(session.id),
        startSession(session.id),
      ]);

      const results = [r1, r2];
      const startedCount = results.filter((r) => r === "started").length;
      const alreadyActiveCount = results.filter(
        (r) => r === "already_active",
      ).length;

      assertEqual(startedCount, 1, "exactly one call should return 'started'");
      assertEqual(
        alreadyActiveCount,
        1,
        "exactly one call should return 'already_active'",
      );
    },
  );

  await cleanupAll();
  await finishTests();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
