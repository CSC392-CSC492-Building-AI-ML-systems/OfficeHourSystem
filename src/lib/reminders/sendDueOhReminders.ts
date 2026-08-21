import { prisma } from "@/lib/prisma";
import { reminderConfig } from "@/config/reminders";
import { sendEmail, type EmailSender } from "@/lib/email/sendEmail";
import { buildReminderEmail } from "@/lib/reminders/reminderEmail";

export type ReminderRunResult = {
  sent: number;
  skippedNoEmail: number;
  failed: number;
};

/**
 * Find interested users whose session is entering an enabled reminder tier's
 * window and email them — once per (interest, tier).
 *
 * Dedup: a reminder is "claimed" by inserting its OfficeHourReminder row
 * (unique on interestId+minutesBefore) BEFORE sending. If the insert is a
 * duplicate, another run already handled it. If the send then fails, the claim
 * is deleted so the next run retries. This keeps reminders at-most-once in the
 * happy path and self-healing on transient send failures.
 *
 * Timing: the window is open-ended (startsAt <= now + tier), so the first cron
 * tick after a session enters a tier fires it; per-tier dedup stops repeats.
 *
 * `now` and `send` are injectable for tests. `dryRun` skips claiming/marking
 * entirely (read-only) so callers can preview what would be sent.
 */
export async function sendDueOhReminders(opts?: {
  now?: Date;
  send?: EmailSender;
  dryRun?: boolean;
}): Promise<ReminderRunResult> {
  const now = opts?.now ?? new Date();
  const send = opts?.send ?? sendEmail;
  const dryRun = opts?.dryRun ?? false;
  const result: ReminderRunResult = { sent: 0, skippedNoEmail: 0, failed: 0 };

  const tiers = reminderConfig.tiers.filter((t) => t.enabled);

  for (const tier of tiers) {
    if (result.sent >= reminderConfig.maxEmailsPerRun) break;

    const cutoff = new Date(now.getTime() + tier.minutesBefore * 60_000);

    // Interested users whose SCHEDULED session starts within this tier's window
    // and who haven't been reminded for this tier yet.
    const interests = await prisma.officeHourInterest.findMany({
      where: {
        reminders: { none: { minutesBefore: tier.minutesBefore } },
        session: {
          status: "SCHEDULED",
          startsAt: { gt: now, lte: cutoff },
        },
      },
      select: {
        id: true,
        user: { select: { email: true, firstName: true } },
        session: {
          select: {
            title: true,
            startsAt: true,
            location: true,
            offering: {
              select: {
                termCode: true,
                course: { select: { code: true } },
              },
            },
          },
        },
      },
      take: reminderConfig.maxEmailsPerRun,
    });

    for (const interest of interests) {
      if (result.sent >= reminderConfig.maxEmailsPerRun) break;

      if (!interest.user.email) {
        result.skippedNoEmail++;
        continue;
      }

      // Claim the send. skipDuplicates → count 0 means already claimed/sent.
      // Dry run skips claiming so it stays read-only.
      if (!dryRun) {
        const claim = await prisma.officeHourReminder.createMany({
          data: [
            { interestId: interest.id, minutesBefore: tier.minutesBefore },
          ],
          skipDuplicates: true,
        });
        if (claim.count === 0) continue;
      }

      try {
        const { subject, html } = buildReminderEmail({
          firstName: interest.user.firstName,
          courseCode: interest.session.offering.course.code,
          termCode: interest.session.offering.termCode,
          title: interest.session.title,
          startsAt: interest.session.startsAt,
          location: interest.session.location,
          minutesBefore: tier.minutesBefore,
        });
        await send({ to: interest.user.email, subject, html });
        result.sent++;
      } catch (e) {
        if (dryRun) {
          result.failed++;
          continue;
        }
        // Release the claim so a later run can retry this reminder.
        await prisma.officeHourReminder.deleteMany({
          where: {
            interestId: interest.id,
            minutesBefore: tier.minutesBefore,
          },
        });
        result.failed++;
        console.error(
          `[reminders] send failed for interest ${interest.id} tier ${tier.minutesBefore}:`,
          e,
        );
      }
    }
  }

  return result;
}
