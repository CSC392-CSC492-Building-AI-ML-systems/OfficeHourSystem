import { redirect } from "next/navigation";

import MyQueuesPage from "@/app/components/instructor/queues/MyQueuesPage";
import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import { prisma } from "@/lib/prisma";

export default async function InstructorMyQueuesPage() {
  const session = await getRequestSession();
  if (!session) {
    redirect("/api/auth/session?redirect=/instructor/my-queues");
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
      <MyQueuesPage />
    </main>
  );
}
