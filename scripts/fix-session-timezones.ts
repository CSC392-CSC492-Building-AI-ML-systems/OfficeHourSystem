/**
 * One-off repair for office-hour times saved while the server ran in UTC.
 *
 * Before the Toronto-time fix, "2:00 PM" was stored as 14:00 UTC (10 AM
 * Toronto). This rewrites each affected timestamp so its UTC wall-clock
 * becomes the Toronto wall-clock (14:00Z → 18:00Z in summer, 19:00Z in winter).
 *
 * Touches OfficeHourSession.startsAt/endsAt and
 * OfficeHourSchedule.validFrom/validUntil, only for rows created AND last
 * updated before --before. Applying bumps updatedAt, so a re-run skips rows it
 * already fixed. Run it right after deploying the fix: rows touched after the
 * deploy (e.g. a session started or renamed) are skipped even if still shifted.
 *
 * Rows created by a server/laptop already on Toronto time were never shifted.
 * Check the dry-run output before applying.
 *
 * How to run:
 *   npx tsx scripts/fix-session-timezones.ts --before=2026-09-28T21:30:00Z          # dry run
 *   npx tsx scripts/fix-session-timezones.ts --before=2026-09-28T21:30:00Z --apply
 */

import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { torontoDateTime } from "@/lib/time/toronto";

function utcWallClockAsToronto(date: Date): Date {
  return torontoDateTime(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
    date.getUTCMilliseconds(),
  );
}

function fixOptional(date: Date | null): Date | null {
  return date ? utcWallClockAsToronto(date) : null;
}

async function main() {
  const beforeArg = process.argv.find((arg) => arg.startsWith("--before="));
  const before = beforeArg
    ? new Date(beforeArg.slice("--before=".length))
    : null;
  if (!before || Number.isNaN(before.getTime())) {
    throw new Error(
      "Pass --before=<ISO time the Toronto-time fix was deployed>",
    );
  }
  const apply = process.argv.includes("--apply");
  const where = { createdAt: { lt: before }, updatedAt: { lt: before } };

  const sessions = await prisma.officeHourSession.findMany({
    where,
    select: { id: true, title: true, startsAt: true, endsAt: true },
    orderBy: { startsAt: "asc" },
  });
  const schedules = await prisma.officeHourSchedule.findMany({
    where,
    select: { id: true, title: true, validFrom: true, validUntil: true },
  });

  for (const s of sessions) {
    console.log(
      `session ${s.id} "${s.title}": ${s.startsAt.toISOString()} → ${utcWallClockAsToronto(s.startsAt).toISOString()}`,
    );
  }
  for (const s of schedules) {
    console.log(
      `schedule ${s.id} "${s.title}": ${s.validFrom?.toISOString() ?? "null"} → ${fixOptional(s.validFrom)?.toISOString() ?? "null"}`,
    );
  }
  console.log(`\n${sessions.length} sessions, ${schedules.length} schedules`);

  if (!apply) {
    console.log("Dry run. Re-run with --apply to write.");
    return;
  }

  await prisma.$transaction([
    ...sessions.map((s) =>
      prisma.officeHourSession.update({
        where: { id: s.id },
        data: {
          startsAt: utcWallClockAsToronto(s.startsAt),
          endsAt: utcWallClockAsToronto(s.endsAt),
        },
      }),
    ),
    ...schedules.map((s) =>
      prisma.officeHourSchedule.update({
        where: { id: s.id },
        data: {
          validFrom: fixOptional(s.validFrom),
          validUntil: fixOptional(s.validUntil),
        },
      }),
    ),
  ]);
  console.log("Applied.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
