import { getInterestedSessionsForStudent } from "@/lib/queries/student_interest/student-interest";

export async function getMyInterestedSessionsService(userId: number) {
  return getInterestedSessionsForStudent(userId);
}
