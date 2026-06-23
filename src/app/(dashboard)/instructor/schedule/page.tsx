import { redirect } from "next/navigation";

import InstructorScheduleDashboard from "@/app/components/instructor/schedule/InstructorScheduleDashboard";
import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import { prisma } from "@/lib/prisma";
import { getInstructorSchedulePage } from "@/lib/queries/officeHourScheduling";

export default async function InstructorSchedulePage() {
  const session = await getRequestSession();
  if (!session) {
    redirect("/api/auth/session?redirect=/instructor/schedule");
  }

  const userId = parseSessionUserId(session);

  // Only teaching staff (TA/INSTRUCTOR in some offering) may view schedules.
  const membership = await prisma.offeringMember.findFirst({
    where: { userId, role: { in: ["INSTRUCTOR", "TA"] } },
    select: { id: true },
  });
  if (!membership) {
    redirect("/student");
  }

  const initialData = await getInstructorSchedulePage(userId);

  return (
    <main>
      <InstructorScheduleDashboard initialData={initialData} />
    </main>
  );
}
