import type { QueueSession, QueueStudent } from "./types";

// TODO: Replace dummy queue data with API data after schema is finalized.
export const DUMMY_QUEUE_SESSIONS: QueueSession[] = [
  {
    id: "csc207-debugging",
    courseLabel: "CSC207 SOFTWARE DESIGN",
    title: "Debugging Queue",
    time: "Today, 2:00 PM - 4:00 PM",
    location: "BA 3110 (Design Studio)",
    isHighlighted: true,
    workspaceSubtitle: "CSCI 3100: Software Engineering • Lab Session A",
    lastScanLabel: "Sarah Chen checked in",
    status: "ACTIVE",
    endsAt: "2026-06-18T20:00:00.000Z",
  },
  {
    id: "csc108-office-hours",
    courseLabel: "CSC108 INTRODUCTION TO CS",
    title: "General Office Hours",
    time: "Today, 4:30 PM - 6:00 PM",
    location: "BA 3110 (Design Studio)",
    workspaceSubtitle:
      "CSC108: Introduction to Computer Science • Studio Hours",
    lastScanLabel: "David Park checked in",
    status: "SCHEDULED",
    endsAt: "2026-06-18T22:00:00.000Z",
  },
];

export const DUMMY_WAITING_STUDENTS: QueueStudent[] = [
  {
    id: "student-sarah-chen",
    name: "Sarah Chen",
    username: "schen_9",
    initials: "SC",
  },
  {
    id: "student-david-park",
    name: "David Park",
    username: "dpark88",
    initials: "DP",
  },
  {
    id: "student-amara-jones",
    name: "Amara Jones",
    username: "ajones_ta",
    initials: "AJ",
  },
  {
    id: "student-kevin-lee",
    name: "Kevin Lee",
    username: "klee_92",
    initials: "KL",
  },
];
