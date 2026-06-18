"use server";

import { showUpcomingOhService } from "@/services/show_upcoming_oh/show-upcoming-oh";
import type { UpcomingSessionDto } from "@/lib/types/queue";

// Action: called from the frontend when user enters My Queue page
export async function showUpcomingOhAction(): Promise<UpcomingSessionDto[]> {
  return showUpcomingOhService();
}
