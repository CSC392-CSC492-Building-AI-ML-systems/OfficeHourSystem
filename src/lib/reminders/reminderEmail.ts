// Build the reminder email copy. Times are stored as UTC in the DB, so we
// format to America/Toronto for display.
import { formatCourseLabel } from "@/lib/courseLabel";

function formatToronto(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

// "in about 1 hour" / "in about 24 hours" from the tier's lead time.
function leadTimeLabel(minutesBefore: number): string {
  if (minutesBefore % 60 === 0) {
    const hours = minutesBefore / 60;
    return `in about ${hours} hour${hours === 1 ? "" : "s"}`;
  }
  return `in about ${minutesBefore} minutes`;
}

export function buildReminderEmail(input: {
  firstName: string | null;
  courseCode: string;
  termCode: string;
  title: string;
  startsAt: Date;
  location: string | null;
  minutesBefore: number;
}): { subject: string; html: string } {
  const when = formatToronto(input.startsAt);
  const lead = leadTimeLabel(input.minutesBefore);
  const greeting = input.firstName ? `Hi ${input.firstName},` : "Hi,";
  const place = input.location ?? "TBD";
  const courseLabel = formatCourseLabel(input.courseCode, input.termCode);

  const subject = `Reminder: ${courseLabel} office hours ${lead}`;

  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, sans-serif; color: #111; line-height: 1.5;">
      <p>${greeting}</p>
      <p>This is a reminder that an office hour session you're interested in starts <strong>${lead}</strong>:</p>
      <table style="border-collapse: collapse; margin: 12px 0;">
        <tr><td style="padding: 2px 12px 2px 0; color: #555;">Course</td><td><strong>${courseLabel}</strong></td></tr>
        <tr><td style="padding: 2px 12px 2px 0; color: #555;">Session</td><td>${input.title}</td></tr>
        <tr><td style="padding: 2px 12px 2px 0; color: #555;">Starts</td><td>${when} (Toronto)</td></tr>
        <tr><td style="padding: 2px 12px 2px 0; color: #555;">Location</td><td>${place}</td></tr>
      </table>
      <p style="color: #777; font-size: 13px;">You're receiving this because you marked yourself interested in this session.</p>
    </div>
  `.trim();

  return { subject, html };
}
