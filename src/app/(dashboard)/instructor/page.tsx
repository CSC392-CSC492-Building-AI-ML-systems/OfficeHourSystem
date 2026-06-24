import { redirect } from "next/navigation";

import InstructorDashboard from "@/app/components/instructor/InstructorDashboard";
import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import { prisma } from "@/lib/prisma";

export default async function InstructorPage() {
  const session = await getRequestSession();
  if (!session) {
    redirect("/api/auth/session?redirect=/instructor");
  }

  const userId = parseSessionUserId(session);
  const membership = await prisma.offeringMember.findFirst({
    where: { userId, role: { in: ["INSTRUCTOR", "TA"] } },
    select: { id: true },
  });

  if (!membership) {
    redirect("/student");
  }

  return (
    <main>
      <InstructorDashboard />
    </main>
  );
}
