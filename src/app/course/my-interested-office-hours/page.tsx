import { redirect } from "next/navigation";

import {
  COURSE_NAV_ITEMS,
  courseNavEndItems,
} from "@/app/components/course/courseNav";
import { InterestedSessionsPage } from "@/app/components/student/InterestedSessionsPage";
import { Navbar } from "@/app/components/shared/Navbar";
import { isAdmin } from "@/lib/adminList";
import { getUserAudienceProfile } from "@/lib/auth/userAudience";
import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import { getMyInterestedSessionsService } from "@/services/student_interest/student-interest";

export default async function MyInterestedOfficeHoursPage() {
  const session = await getRequestSession();
  if (!session) {
    redirect("/api/auth/session?redirect=/course/my-interested-office-hours");
  }

  const userId = parseSessionUserId(session);
  const [sessions, profile] = await Promise.all([
    getMyInterestedSessionsService(userId),
    getUserAudienceProfile(userId, session.utorid),
  ]);

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <Navbar
          brandHref="/course"
          items={COURSE_NAV_ITEMS}
          endItems={courseNavEndItems(
            isAdmin(session.utorid),
            profile?.isInstructor === true,
          )}
          activeKey="interested"
        />
        <InterestedSessionsPage initialSessions={sessions} />
      </div>
    </div>
  );
}
