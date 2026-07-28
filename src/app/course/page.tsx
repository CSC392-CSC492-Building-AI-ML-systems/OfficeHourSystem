import Link from "next/link";
import { redirect } from "next/navigation";

import { Navbar } from "@/app/components/shared/Navbar";
import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import {
  listCoursePickerOfferings,
  type CoursePickerItem,
} from "@/lib/queries/course/offerings";

function CourseCard({ course }: { course: CoursePickerItem }) {
  const instructors =
    course.instructorNames.length > 0
      ? course.instructorNames.join(", ")
      : "No instructors listed";

  return (
    <Link
      href={course.href}
      className="group flex flex-col overflow-hidden rounded-lg bg-white shadow-[0_2px_8px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,23,42,0.16)]"
    >
      <div className="flex min-h-36 items-center justify-center bg-[#5b9ed0] px-4 py-8">
        <p className="text-center text-4xl font-black tracking-tight text-[#0a3d66] sm:text-5xl">
          {course.courseCode}
        </p>
      </div>
      <div className="flex flex-1 flex-col gap-1 px-4 py-4">
        <p className="truncate text-sm font-semibold text-[#0b5cab] group-hover:underline">
          {course.courseCode}
        </p>
        <p className="text-sm text-slate-700">{course.roleLabel}</p>
        <p className="text-sm text-slate-500">{instructors}</p>
        <p className="mt-1 text-xs text-slate-400">Term {course.termCode}</p>
      </div>
    </Link>
  );
}

export default async function CoursePage() {
  const session = await getRequestSession();
  if (!session) {
    redirect("/api/auth/session?redirect=/course");
  }

  const courses = await listCoursePickerOfferings(parseSessionUserId(session));

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col px-4 py-6 sm:px-6">
        <Navbar brandHref="/course" />

        <header className="mb-8 mt-10">
          <h1 className="text-3xl font-bold tracking-tight text-[#071f41]">
            Your courses
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Signed in as{" "}
            <span className="font-mono text-[#071f41]">{session.utorid}</span>
          </p>
        </header>

        {courses.length === 0 ? (
          <p className="rounded-lg bg-white px-6 py-12 text-center text-sm text-slate-500 shadow-sm">
            You are not in any courses yet.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.offeringPublicId} course={course} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
