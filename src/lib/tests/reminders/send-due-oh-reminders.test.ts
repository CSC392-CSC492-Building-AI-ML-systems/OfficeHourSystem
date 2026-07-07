/**
 * Tests: sendDueOhReminders()
 *
 * How to run:
 *   npx tsx src/lib/tests/reminders/send-due-oh-reminders.test.ts
 *
 * A fake email sender and a fixed `now` are injected, so no real emails are
 * sent. Exercises the default-enabled 60-minute tier (the tier mechanism is
 * identical for the 24h tier — only the number differs).
 *
 * Scenarios:
 *   1. Session within the window + user with email → one email, reminder row written
 *   2. Session outside the window (too far out) → nothing sent
 *   3. Session already started → nothing sent
 *   4. Non-SCHEDULED session (ACTIVE/CANCELLED) in window → nothing sent
 *   5. Interested user with no email → skipped, no reminder row
 *   6. Dedup: running twice sends only once
 *   7. Send failure → claim rolled back, later run retries successfully
 *   8. Dry run → previews send but writes no reminder row
 */

import "dotenv/config";

import type { OfficeHourSessionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendDueOhReminders } from "@/lib/reminders/sendDueOhReminders";
import type { EmailMessage } from "@/lib/email/sendEmail";
import {
  TEST_PREFIX,
  TEST_TERM,
  cleanupAll,
  assert,
  assertEqual,
  runTest,
  finishTests,
} from "../_seed";

const NOW = new Date("2026-07-02T12:00:00.000Z");

function collector() {
  const sent: EmailMessage[] = [];
  return { sent, send: async (m: EmailMessage) => void sent.push(m) };
}

async function makeOffering(suffix: string) {
  const course = await prisma.course.create({
    data: { code: `${TEST_PREFIX}REM${suffix}` },
  });
  return prisma.courseOffering.create({
    data: { courseId: course.id, termCode: TEST_TERM },
  });
}

async function makeUser(suffix: string, email: string | null) {
  return prisma.user.create({
    data: {
      utorid: `${TEST_PREFIX}rem_${suffix}`,
      firstName: "Rem",
      lastName: suffix,
      email,
    },
  });
}

async function makeSession(
  offeringId: number,
  minutesFromNow: number,
  status: OfficeHourSessionStatus,
) {
  const startsAt = new Date(NOW.getTime() + minutesFromNow * 60_000);
  return prisma.officeHourSession.create({
    data: {
      offeringId,
      title: "Reminder Session",
      type: "DEBUGGING",
      startsAt,
      endsAt: new Date(startsAt.getTime() + 60 * 60_000),
      location: "BA 3200",
      status,
    },
  });
}

async function makeInterest(userId: number, sessionId: number) {
  return prisma.officeHourInterest.create({ data: { userId, sessionId } });
}

async function reminderCount(interestId: number) {
  return prisma.officeHourReminder.count({ where: { interestId } });
}

async function main() {
  console.log("=== send-due-oh-reminders.test.ts ===\n");
  await cleanupAll();

  // 1. In-window session + emailed user → one send + reminder row
  await runTest("session in window → one email sent and marked", async () => {
    await cleanupAll();
    const offering = await makeOffering("1");
    const user = await makeUser("1", "s1@mail.utoronto.ca");
    const session = await makeSession(offering.id, 30, "SCHEDULED");
    const interest = await makeInterest(user.id, session.id);

    const { sent, send } = collector();
    const res = await sendDueOhReminders({ now: NOW, send });

    assertEqual(res.sent, 1, "one sent");
    assertEqual(sent.length, 1, "one email captured");
    assertEqual(sent[0].to, "s1@mail.utoronto.ca", "recipient");
    assert(sent[0].subject.includes("office hours"), "subject mentions OH");
    assertEqual(await reminderCount(interest.id), 1, "reminder row written");
  });

  // 2. Session too far out → nothing
  await runTest("session beyond the window → nothing sent", async () => {
    await cleanupAll();
    const offering = await makeOffering("2");
    const user = await makeUser("2", "s2@mail.utoronto.ca");
    const session = await makeSession(offering.id, 90, "SCHEDULED"); // >60m
    await makeInterest(user.id, session.id);

    const { send } = collector();
    const res = await sendDueOhReminders({ now: NOW, send });
    assertEqual(res.sent, 0, "nothing sent");
  });

  // 3. Session already started → nothing
  await runTest("session already started → nothing sent", async () => {
    await cleanupAll();
    const offering = await makeOffering("3");
    const user = await makeUser("3", "s3@mail.utoronto.ca");
    const session = await makeSession(offering.id, -5, "SCHEDULED");
    await makeInterest(user.id, session.id);

    const { send } = collector();
    const res = await sendDueOhReminders({ now: NOW, send });
    assertEqual(res.sent, 0, "nothing sent");
  });

  // 4. Non-SCHEDULED session in window → nothing
  await runTest(
    "cancelled/active session in window → nothing sent",
    async () => {
      await cleanupAll();
      const offering = await makeOffering("4");
      const user = await makeUser("4", "s4@mail.utoronto.ca");
      const cancelled = await makeSession(offering.id, 30, "CANCELLED");
      const active = await makeSession(offering.id, 30, "ACTIVE");
      await makeInterest(user.id, cancelled.id);
      const u4b = await makeUser("4b", "s4b@mail.utoronto.ca");
      await makeInterest(u4b.id, active.id);

      const { send } = collector();
      const res = await sendDueOhReminders({ now: NOW, send });
      assertEqual(res.sent, 0, "nothing sent for non-scheduled");
    },
  );

  // 5. No email → skipped, no reminder row
  await runTest("interested user with no email → skipped", async () => {
    await cleanupAll();
    const offering = await makeOffering("5");
    const user = await makeUser("5", null);
    const session = await makeSession(offering.id, 30, "SCHEDULED");
    const interest = await makeInterest(user.id, session.id);

    const { sent, send } = collector();
    const res = await sendDueOhReminders({ now: NOW, send });
    assertEqual(res.sent, 0, "nothing sent");
    assertEqual(res.skippedNoEmail, 1, "counted as skipped");
    assertEqual(sent.length, 0, "no email captured");
    assertEqual(await reminderCount(interest.id), 0, "no reminder row");
  });

  // 6. Dedup across runs
  await runTest("running twice sends only once", async () => {
    await cleanupAll();
    const offering = await makeOffering("6");
    const user = await makeUser("6", "s6@mail.utoronto.ca");
    const session = await makeSession(offering.id, 30, "SCHEDULED");
    const interest = await makeInterest(user.id, session.id);

    const first = collector();
    const r1 = await sendDueOhReminders({ now: NOW, send: first.send });
    assertEqual(r1.sent, 1, "first run sends");

    const second = collector();
    const r2 = await sendDueOhReminders({ now: NOW, send: second.send });
    assertEqual(r2.sent, 0, "second run sends nothing");
    assertEqual(await reminderCount(interest.id), 1, "still one reminder row");
  });

  // 7. Send failure rolls back the claim; a later run retries
  await runTest("send failure → claim rolled back, retried later", async () => {
    await cleanupAll();
    const offering = await makeOffering("7");
    const user = await makeUser("7", "s7@mail.utoronto.ca");
    const session = await makeSession(offering.id, 30, "SCHEDULED");
    const interest = await makeInterest(user.id, session.id);

    const failing = async () => {
      throw new Error("provider down");
    };
    const r1 = await sendDueOhReminders({ now: NOW, send: failing });
    assertEqual(r1.failed, 1, "one failure");
    assertEqual(await reminderCount(interest.id), 0, "claim rolled back");

    const ok = collector();
    const r2 = await sendDueOhReminders({ now: NOW, send: ok.send });
    assertEqual(r2.sent, 1, "retry succeeds");
    assertEqual(await reminderCount(interest.id), 1, "now marked");
  });

  // 8. Dry run previews but writes nothing
  await runTest("dry run previews without marking", async () => {
    await cleanupAll();
    const offering = await makeOffering("8");
    const user = await makeUser("8", "s8@mail.utoronto.ca");
    const session = await makeSession(offering.id, 30, "SCHEDULED");
    const interest = await makeInterest(user.id, session.id);

    const { sent, send } = collector();
    const res = await sendDueOhReminders({ now: NOW, send, dryRun: true });
    assertEqual(res.sent, 1, "counts as would-send");
    assertEqual(sent.length, 1, "preview captured");
    assertEqual(await reminderCount(interest.id), 0, "no reminder row written");
  });

  await cleanupAll();
  await finishTests();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
