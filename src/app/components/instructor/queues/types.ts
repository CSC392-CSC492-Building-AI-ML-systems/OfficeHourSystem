export interface QueueSession {
  id: string;
  courseLabel: string;
  title: string;
  time: string;
  location: string;
  isHighlighted?: boolean;
  workspaceSubtitle: string;
  lastScanLabel: string;
  status: "SCHEDULED" | "ACTIVE" | "DELAYED" | "COMPLETED" | "CANCELLED";
  endsAt: string; // ISO string
  interestedCount: number;
}

export interface QueueStudent {
  id: string;
  name: string;
  username: string;
  initials: string;
}
