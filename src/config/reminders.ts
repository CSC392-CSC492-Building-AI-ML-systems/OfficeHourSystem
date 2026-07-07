/**
 * OH email-reminder configuration.
 *
 * Each tier fires ONE email per interested user, once, when a session first
 * enters that tier's lead-time window (see sendDueOhReminders). Tiers dedupe
 * independently, so enabling the 24h tier does not affect the 1h tier.
 *
 * Change `enabled` here to turn a tier on/off — no schema change needed.
 */
export type ReminderTier = {
  minutesBefore: number; // lead time before session start (minutes)
  enabled: boolean;
};

export const reminderConfig: {
  tiers: ReminderTier[];
  maxEmailsPerRun: number;
} = {
  tiers: [
    { minutesBefore: 60, enabled: true }, // 1 hour before — default ON
    { minutesBefore: 24 * 60, enabled: false }, // 24 hours before — opt-in
  ],
  // Safety cap per run so a backlog can't blow the provider's daily quota
  // (Brevo free tier = 300/day). Reminders beyond this are picked up next run.
  maxEmailsPerRun: 250,
};
