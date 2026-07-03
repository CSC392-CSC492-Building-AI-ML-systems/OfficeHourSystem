import { redirect } from "next/navigation";
import Link from "next/link";
import { BarChart3, ChevronRight } from "lucide-react";

import CourseOverviewPage from "@/app/components/instructor/stats/CourseOverviewPage";
import { Navbar } from "@/app/components/instructor/Navbar";
import { getRequestSession } from "@/lib/auth/getRequestSession";
import {
  getCourseOverviewService,
  listInstructorOfferingsService,
} from "@/services/course_stats/course-overview";
import type { CourseOverviewDto } from "@/lib/types/queue";

interface PageProps {
  searchParams: Promise<{ offering?: string }>;
}

export default async function CourseOverviewRoute({ searchParams }: PageProps) {
  const session = await getRequestSession();
  if (!session) {
    redirect("/api/auth/session?redirect=/instructor/course-stats/overview");
  }

  // Must be INSTRUCTOR of at least one offering; otherwise back to dashboard.
  const offerings = await listInstructorOfferingsService();
  if (offerings.length === 0) {
    redirect("/instructor");
  }

  const { offering: selected } = await searchParams;

  // No course chosen yet → show the picker.
  if (!selected) {
    return (
      <main>
        <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
          <div className="mx-auto flex w-full max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8">
            <Navbar />
            <main className="mt-10 space-y-8">
              <section className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-[#071f41] sm:text-[2.1rem]">
                  Course-level Overview
                </h1>
                <p className="text-base text-slate-600">
                  Pick a course to see aggregate office-hour stats and
                  per-student breakdowns.
                </p>
              </section>

              <section className="grid gap-4 sm:grid-cols-2">
                {offerings.map((o) => (
                  <Link
                    key={o.offeringPublicId}
                    href={`/instructor/course-stats/overview?offering=${o.offeringPublicId}`}
                    className="group flex items-center justify-between rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-[0_16px_44px_-32px_rgba(15,41,66,0.35)] transition hover:-translate-y-0.5 hover:border-slate-300"
                  >
                    <div className="flex items-center gap-4">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef5ff] text-[#071f41]">
                        <BarChart3 className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-lg font-semibold text-[#071f41]">
                          {o.courseCode}
                        </p>
                        <p className="text-sm text-slate-500">
                          Term {o.termCode}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:text-[#071f41]" />
                  </Link>
                ))}
              </section>
            </main>
          </div>
        </div>
      </main>
    );
  }

  // A course is chosen → load its overview (service enforces INSTRUCTOR of it).
  let overview: CourseOverviewDto;
  try {
    overview = await getCourseOverviewService(selected);
  } catch {
    redirect("/instructor/course-stats/overview");
  }

  return (
    <main>
      <CourseOverviewPage overview={overview} />
    </main>
  );
}
