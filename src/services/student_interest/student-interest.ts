import { getUserAudienceProfile } from "@/lib/auth/userAudience";
import { getInterestedSessionsForStudent } from "@/lib/queries/student_interest/student-interest";

export async function getMyInterestedSessionsService(
  userId: number,
  utorid: string,
) {
  const profile = await getUserAudienceProfile(userId, utorid);
  if (!profile) throw new Error("Unauthorized");
  if (profile.kind !== "student") {
    throw new Error("Forbidden: interested sessions are student-only");
  }
  return getInterestedSessionsForStudent(userId);
}
