import { redirect } from "next/navigation";

import { CoursePicker } from "@/app/components/course/CoursePicker";
import {
  COURSE_NAV_ITEMS,
  STUDENT_COURSE_NAV_ITEMS,
  courseNavEndItems,
} from "@/app/components/course/courseNav";
import { Navbar } from "@/app/components/shared/Navbar";
import { isAdmin } from "@/lib/adminList";
import { getUserAudienceProfile } from "@/lib/auth/userAudience";
import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import { listCoursePickerOfferings } from "@/lib/queries/course/offerings";

export default async function CoursePage() {
  const session = await getRequestSession();
  if (!session) {
    redirect("/api/auth/session?redirect=/course");
  }

  const userId = parseSessionUserId(session);
  const [courses, profile] = await Promise.all([
    listCoursePickerOfferings(userId),
    getUserAudienceProfile(userId, session.utorid),
  ]);

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <Navbar
          brandHref="/"
          activeKey="courses"
          items={
            profile?.kind === "student"
              ? STUDENT_COURSE_NAV_ITEMS
              : COURSE_NAV_ITEMS
          }
          endItems={courseNavEndItems(
            isAdmin(session.utorid),
            profile?.isInstructor === true,
          )}
        />

        <header className="mb-8 mt-10">
          <h1 className="text-3xl font-bold tracking-tight text-[#071f41]">
            Your courses
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Signed in as{" "}
            <span className="font-mono text-[#071f41]">{session.utorid}</span>
          </p>
        </header>

        <CoursePicker
          courses={courses}
          canAddCourse={profile?.isInstructor === true}
        />
      </div>
    </main>
  );
}
