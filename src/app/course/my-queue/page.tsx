import { redirect } from "next/navigation";

import {
  COURSE_NAV_ITEMS,
  STUDENT_COURSE_NAV_ITEMS,
  courseNavEndItems,
} from "@/app/components/course/courseNav";
import { StudentMyQueuePage } from "@/app/components/student/StudentMyQueuePage";
import { Navbar } from "@/app/components/shared/Navbar";
import { isAdmin } from "@/lib/adminList";
import { getUserAudienceProfile } from "@/lib/auth/userAudience";
import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import { getStudentQueueService } from "@/services/student_queue/student-queue";

export default async function CourseMyQueueRoute() {
  const session = await getRequestSession();
  if (!session) {
    redirect("/api/auth/session?redirect=/course/my-queue");
  }

  const userId = parseSessionUserId(session);
  const [tickets, profile] = await Promise.all([
    getStudentQueueService(),
    getUserAudienceProfile(userId, session.utorid),
  ]);

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <Navbar
          brandHref="/course"
          items={
            profile?.kind === "student"
              ? STUDENT_COURSE_NAV_ITEMS
              : COURSE_NAV_ITEMS
          }
          endItems={courseNavEndItems(
            isAdmin(session.utorid),
            profile?.isInstructor === true,
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
