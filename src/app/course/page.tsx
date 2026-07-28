import { redirect } from "next/navigation";

import { CoursePicker } from "@/app/components/course/CoursePicker";
import {
  COURSE_NAV_END_ITEMS,
  COURSE_NAV_ITEMS,
} from "@/app/components/course/courseNav";
import { Navbar } from "@/app/components/shared/Navbar";
import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import { listCoursePickerOfferings } from "@/lib/queries/course/offerings";
import { prisma } from "@/lib/prisma";

export default async function CoursePage() {
  const session = await getRequestSession();
  if (!session) {
    redirect("/api/auth/session?redirect=/course");
  }

  const userId = parseSessionUserId(session);
  const [courses, user] = await Promise.all([
    listCoursePickerOfferings(userId),
    prisma.user.findUnique({
      where: { id: userId },
      select: { isInstructor: true },
    }),
  ]);

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <Navbar
          brandHref="/course"
          activeKey="courses"
          items={COURSE_NAV_ITEMS}
          endItems={COURSE_NAV_END_ITEMS}
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
          canAddCourse={user?.isInstructor === true}
        />
      </div>
    </main>
  );
}
