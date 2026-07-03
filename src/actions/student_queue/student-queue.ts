"use server";

import { getStudentQueueService } from "@/services/student_queue/student-queue";

export async function getStudentQueueAction() {
  return getStudentQueueService();
}
