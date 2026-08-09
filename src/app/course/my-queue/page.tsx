import { redirect } from "next/navigation";

import {
  COURSE_NAV_ITEMS,
  courseNavEndItems,
} from "@/app/components/course/courseNav";
import { StudentMyQueuePage } from "@/app/components/student/StudentMyQueuePage";
import { Navbar } from "@/app/components/shared/Navbar";
import { isAdmin } from "@/lib/adminList";
import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import { prisma } from "@/lib/prisma";
import { getStudentQueueService } from "@/services/student_queue/student-queue";

export default async function CourseMyQueueRoute() {
  const session = await getRequestSession();
  if (!session) {
    redirect("/api/auth/session?redirect=/course/my-queue");
  }

  const userId = parseSessionUserId(session);
  const [tickets, user] = await Promise.all([
    getStudentQueueService(),
    prisma.user.findUnique({
      where: { id: userId },
      select: { isInstructor: true },
    }),
  ]);

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <Navbar
          brandHref="/course"
          items={COURSE_NAV_ITEMS}
          endItems={courseNavEndItems(
            isAdmin(session.utorid),
            user?.isInstructor === true,
          )}
          activeKey="queue"
        />
        <main className="mt-10">
          <StudentMyQueuePage initialTickets={tickets} />
        </main>
      </div>
    </div>
  );
}
