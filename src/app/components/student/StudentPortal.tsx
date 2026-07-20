import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, ListOrdered } from "lucide-react";

import type { StudentOfferingListItem } from "@/lib/queries/student/offerings";

type StudentPortalProps = {
  utorid: string;
  firstName: string;
  lastName: string;
  offerings: StudentOfferingListItem[];
};

export function StudentPortal({
  utorid,
  firstName,
  lastName,
  offerings,
}: StudentPortalProps) {
  return (
    <main className="min-h-screen bg-[#f4f7fb]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6">
        <Link
          href="/login"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-[#071f41] underline-offset-4 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>

        <header className="rounded-[36px] border border-slate-200/80 bg-white px-8 py-8 shadow-[0_30px_80px_-40px_rgba(7,31,65,0.45)]">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#c8102e]">
            OHMS Student
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#071f41] sm:text-4xl">
            Student page
          </h1>
          <p className="mt-3 text-base text-slate-600">
            Signed in as{" "}
            <span className="font-mono text-[#071f41]">{utorid}</span> (
            {firstName} {lastName})
          </p>
        </header>

        {/* Global queue status — lives here (not inside a course): one place
            to see live positions across ALL courses. */}
        <Link
          href="/student/my-queue"
          className="flex items-center justify-between rounded-[30px] border border-slate-200/80 bg-white px-6 py-5 shadow-[0_18px_50px_-30px_rgba(15,41,66,0.35)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
        >
          <div className="flex min-w-0 items-center gap-4">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eef5ff] text-[#071f41]">
              <ListOrdered className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-[#071f41]">My Queue</h2>
              <p className="mt-1 text-sm text-slate-500">
                Check your live queue positions across all courses.
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-slate-400" />
        </Link>

        <section className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-[0_18px_50px_-30px_rgba(15,41,66,0.35)]">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-[#071f41]">
              Enrolled courses
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Select a course to open your student dashboard for that offering.
            </p>
          </div>

          {offerings.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              You are not enrolled in any courses yet. If you expect to see a
              course here, ask your instructor to import the classlist.
            </div>
          ) : (
            <ul className="divide-y divide-slate-200">
              {offerings.map((offering) => (
                <li
                  key={offering.offeringPublicId}
                  className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-4">
                    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#edf7ff] text-[#0f5f8f]">
                      <BookOpen className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-[#071f41]">
                        {offering.courseLabel}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {offering.courseCode} · Term {offering.termCode}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={offering.workspaceHref}
                    className="inline-flex items-center gap-2 self-start rounded-full bg-[#071f41] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0f2942] sm:self-auto"
                  >
                    Open student dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
