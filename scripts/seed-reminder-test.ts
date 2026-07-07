/**
 * Seed one "due" OH reminder for end-to-end testing, around the real user
 * Jingcheng Liang (utorid = liang696).
 *
 * What it does:
 *   - Ensures liang696 has an email + is a STUDENT in CSC301H5
 *   - Upserts a SCHEDULED session starting in ~30 min (inside the 60-min tier)
 *   - Marks liang696 interested in it
 *   - Clears any prior reminder rows for that interest so the run is repeatable
 *
 * How to run:
 *   npx tsx scripts/seed-reminder-test.ts
 *
 * Then:
 *   npx tsx scripts/send-oh-reminders.ts --dry-run   # Level 2 (no email)
 *   npx tsx scripts/send-oh-reminders.ts             # Level 3 (real email)
 */
import "dotenv/config";
import { prisma } from "@/lib/prisma";

async function main() {
  console.log("Seeding a due reminder for liang696...\n");

  // 1. The real user
  const liang = await prisma.user.findUnique({ where: { utorid: "liang696" } });
  if (!liang) {
    throw new Error("User liang696 not found — run scripts/seed-dev.ts first");
  }

  // Ensure an email exists (reminders skip users with no email)
  const email = liang.email ?? "liang696@mail.utoronto.ca";
  if (!liang.email) {
    await prisma.user.update({ where: { id: liang.id }, data: { email } });
  }
  console.log(`User: liang696 (id=${liang.id}), email=${email}`);

  // 2. CSC301H5 offering
  const offering = await prisma.courseOffering.findFirst({
    where: { course: { code: "CSC301H5" }, termCode: "20261" },
  });
  if (!offering) {
    throw new Error(
      "CSC301H5 offering not found — run scripts/seed-dev.ts first",
    );
  }

  // Ensure liang is a member of the offering
  await prisma.offeringMember.upsert({
    where: { userId_offeringId: { userId: liang.id, offeringId: offering.id } },
    update: {},
    create: { userId: liang.id, offeringId: offering.id, role: "STUDENT" },
  });

  // 3. SCHEDULED session starting in ~30 min (inside the 60-min window)
  const startsAt = new Date(Date.now() + 30 * 60_000);
  const endsAt = new Date(startsAt.getTime() + 60 * 60_000);

  let session = await prisma.officeHourSession.findFirst({
    where: { offeringId: offering.id, title: "Reminder Test OH" },
  });
  if (session) {
    session = await prisma.officeHourSession.update({
      where: { id: session.id },
      data: { status: "SCHEDULED", startsAt, endsAt },
    });
  } else {
    session = await prisma.officeHourSession.create({
      data: {
        offeringId: offering.id,
        title: "Reminder Test OH",
        type: "DEBUGGING",
        startsAt,
        endsAt,
        location: "BA 3200",
        status: "SCHEDULED",
      },
    });
  }
  console.log(
    `Session: "${session.title}" (id=${session.id}) starts ${startsAt.toLocaleString()}`,
  );

  // 4. Mark liang interested
  const interest = await prisma.officeHourInterest.upsert({
    where: { userId_sessionId: { userId: liang.id, sessionId: session.id } },
    update: {},
    create: { userId: liang.id, sessionId: session.id },
    select: { id: true },
  });

  // 5. Clear any prior reminders so this is a fresh "due" reminder
  const cleared = await prisma.officeHourReminder.deleteMany({
    where: { interestId: interest.id },
  });
  console.log(
    `Interest: id=${interest.id} (cleared ${cleared.count} prior reminder row(s))`,
  );

  console.log("\nDone. One reminder is now due for liang696.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
