import assert from "node:assert/strict";

import { formatCourseLabel } from "@/lib/courseLabel";
import { buildReminderEmail } from "@/lib/reminders/reminderEmail";

assert.equal(formatCourseLabel("JFX101", "20991"), "JFX101 · 20991");

const reminder = buildReminderEmail({
  firstName: "Jacky",
  courseCode: "JFX101",
  termCode: "20991",
  title: "Help Centre",
  startsAt: new Date("2026-08-21T17:00:00.000Z"),
  location: "DH 2014",
  minutesBefore: 60,
});

assert.match(reminder.subject, /JFX101 · 20991/);
assert.match(reminder.html, /JFX101 · 20991/);

console.log("courseLabel.test.ts: all assertions passed");
