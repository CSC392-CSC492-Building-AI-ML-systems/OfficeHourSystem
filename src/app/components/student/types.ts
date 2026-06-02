export interface DropInSession {
  title: string;
  time: string;
  location?: string;
  taName: string;
}

export interface DebuggingSession {
  taName: string;
  location: string;
  isOnline?: boolean;
}

export interface GroupTopicSession {
  topic: string;
  time: string;
}
