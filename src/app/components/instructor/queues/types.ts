export interface QueueSession {
  id: string;
  courseLabel: string;
  title: string;
  time: string;
  location: string;
  isHighlighted?: boolean;
  workspaceSubtitle: string;
  lastScanLabel: string;
}

export interface QueueStudent {
  id: string;
  name: string;
  username: string;
  initials: string;
}
