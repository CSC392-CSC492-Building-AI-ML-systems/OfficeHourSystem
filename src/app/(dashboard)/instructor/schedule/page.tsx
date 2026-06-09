import { redirect } from "next/navigation";

import InstructorScheduleDashboard from "@/app/components/instructor/schedule/InstructorScheduleDashboard";
import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import { getInstructorSchedulePage } from "@/lib/queries/officeHourScheduling";

export default async function InstructorSchedulePage() {
  const session = await getRequestSession();
  if (!session) {
    redirect("/api/auth/session?redirect=/instructor/schedule");
  }

  const userId = parseSessionUserId(session);
  const initialData = await getInstructorSchedulePage(userId);

  return (
    <main>
      <InstructorScheduleDashboard initialData={initialData} />
    </main>
  );
}
