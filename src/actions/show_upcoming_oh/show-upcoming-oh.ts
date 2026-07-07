"use server";

import { showUpcomingOhService } from "@/services/show_upcoming_oh/show-upcoming-oh";
import type { UpcomingSessionDto } from "@/lib/types/queue";

// Action: called from the frontend when user enters My Queue page.
// Pass an offeringPublicId to scope the list to a single course offering
// (per-offering page); omit it for the cross-course view.
export async function showUpcomingOhAction(
  offeringPublicId?: string,
): Promise<UpcomingSessionDto[]> {
  return showUpcomingOhService(offeringPublicId);
}
