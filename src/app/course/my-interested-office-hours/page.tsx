import { redirect } from "next/navigation";

import { STUDENT_COURSE_NAV_ITEMS } from "@/app/components/course/courseNav";
import { InterestedSessionsPage } from "@/app/components/student/InterestedSessionsPage";
import { Navbar } from "@/app/components/shared/Navbar";
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
  let sessions;
  try {
    sessions = await getMyInterestedSessionsService(userId, session.utorid);
  } catch {
    redirect("/course");
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <Navbar
          brandHref="/course"
          items={STUDENT_COURSE_NAV_ITEMS}
          activeKey="interested"
        />
        <InterestedSessionsPage initialSessions={sessions} />
      </div>
    </div>
  );
}
