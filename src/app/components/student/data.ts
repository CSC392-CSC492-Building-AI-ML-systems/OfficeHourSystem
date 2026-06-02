import type {
  DebuggingSession,
  DropInSession,
  GroupTopicSession,
} from "./types";

export const DUMMY_DROP_IN_SESSIONS: DropInSession[] = [
  {
    title: "Morning Session",
    time: "10:00 AM - 12:00 PM",
    location: "BA 3110 (In-Person)",
    taName: "Sarah Chen",
  },
  {
    title: "Evening Session",
    time: "Online (Zoom Link)",
    taName: "James Miller",
  },
];

export const DUMMY_DEBUGGING_SESSIONS: DebuggingSession[] = [
  {
    taName: "David Wu",
    location: "BA 3110 (In-Person)",
  },
  {
    taName: "Sarah Chen",
    location: "Online (Zoom Link)",
    isOnline: true,
  },
];

export const DUMMY_GROUP_TOPIC_SESSIONS: GroupTopicSession[] = [
  {
    topic: "Linked Lists Deep-Dive",
    time: "Today, 2:00 PM",
  },
  {
    topic: "Recursion Workshop",
    time: "Today, 3:30 PM",
  },
  {
    topic: "Big O Notation",
    time: "Tomorrow, 11:00 AM",
  },
];
