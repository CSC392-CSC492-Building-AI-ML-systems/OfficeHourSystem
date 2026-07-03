/**
 * Manually run the OH reminder job (same logic the cron endpoint calls).
 *
 * How to run:
 *   npx tsx scripts/send-oh-reminders.ts            # sends real emails
 *   npx tsx scripts/send-oh-reminders.ts --dry-run  # logs instead of sending
 *
 * --dry-run does NOT claim/mark reminders (no email actually goes out), so it's
 * safe to inspect what would be sent without consuming quota or dedup slots.
 */
import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { sendDueOhReminders } from "@/lib/reminders/sendDueOhReminders";

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  if (dryRun) {
    const result = await sendDueOhReminders({
      dryRun: true,
      send: async (msg) => {
        console.log(`[dry-run] would send → ${msg.to} :: ${msg.subject}`);
      },
    });
    console.log("Dry run complete (nothing sent):", result);
    return;
  }

  const result = await sendDueOhReminders();
  console.log("Reminder run complete:", result);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
