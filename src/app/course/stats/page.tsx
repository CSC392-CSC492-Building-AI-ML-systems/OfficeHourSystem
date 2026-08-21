import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  COURSE_NAV_ITEMS,
  courseNavEndItems,
} from "@/app/components/course/courseNav";
import CourseOverviewPage from "@/app/components/instructor/stats/CourseOverviewPage";
import { Navbar } from "@/app/components/shared/Navbar";
import { isAdmin } from "@/lib/adminList";
import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import { prisma } from "@/lib/prisma";
import {
  getCourseOverviewService,
  listInstructorOfferingsService,
} from "@/services/course_stats/course-overview";
import type {
  CourseOverviewDto,
  InstructorOfferingDto,
} from "@/lib/types/queue";
import { formatCourseLabel } from "@/lib/courseLabel";

type PageProps = {
  searchParams: Promise<{ offering?: string }>;
};

function StatsShell({
  children,
  courseLabel,
  showAdmin,
  isInstructor,
}: {
  children: ReactNode;
  courseLabel?: string;
  showAdmin: boolean;
  isInstructor: boolean;
}) {
  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <Navbar
          brandHref="/course"
          activeKey="stats"
          items={COURSE_NAV_ITEMS}
          endItems={courseNavEndItems(showAdmin, isInstructor)}
          courseLabel={courseLabel}
        />
        {children}
      </div>
    </main>
  );
}

function OfferingCard({ offering }: { offering: InstructorOfferingDto }) {
  return (
    <Link
      href={`/course/stats?offering=${offering.offeringPublicId}`}
      className="group flex flex-col overflow-hidden rounded-lg bg-white shadow-[0_2px_8px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,23,42,0.16)]"
    >
      <div className="relative flex min-h-36 items-center justify-center overflow-hidden bg-[#071f41] px-4 py-8">
        <div
          aria-hidden
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-12deg, transparent, transparent 48px, rgba(255,255,255,0.03) 48px, rgba(255,255,255,0.03) 49px)",
          }}
        />
        <p className="relative text-center text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl">
          {formatCourseLabel(offering.courseCode, offering.termCode)}
        </p>
      </div>
      <div className="flex flex-1 flex-col gap-1 px-4 py-4">
        <p className="truncate text-sm font-semibold text-[#071f41] group-hover:underline">
          {formatCourseLabel(offering.courseCode, offering.termCode)}
        </p>
        <p className="text-sm text-slate-500">View course statistics</p>
      </div>
    </Link>
  );
}

export default async function CourseStatsPage({ searchParams }: PageProps) {
  const session = await getRequestSession();
  if (!session) {
    redirect("/api/auth/session?redirect=/course/stats");
  }

  const userId = parseSessionUserId(session);
  const showAdmin = isAdmin(session.utorid);
  const [offerings, user] = await Promise.all([
    listInstructorOfferingsService(),
    prisma.user.findUnique({
      where: { id: userId },
      select: { isInstructor: true },
    }),
  ]);
  const isInstructor = user?.isInstructor === true;
  const { offering: selected } = await searchParams;

  if (!selected) {
    return (
      <StatsShell showAdmin={showAdmin} isInstructor={isInstructor}>
        <header className="mb-8 mt-10">
          <h1 className="text-3xl font-bold tracking-tight text-[#071f41]">
            Course Stats
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {offerings.length === 0
              ? "You are not an instructor on any course yet, so there are no stats to show."
              : "Pick a course to see aggregate office-hour stats and per-student breakdowns."}
          </p>
        </header>

        {offerings.length === 0 ? (
          <p className="rounded-lg bg-white px-6 py-12 text-center text-sm text-slate-500 shadow-sm">
            Create a course from Your courses, or ask to be added as an
            instructor on an existing offering.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {offerings.map((offering) => (
              <OfferingCard
                key={offering.offeringPublicId}
                offering={offering}
              />
            ))}
          </div>
        )}
      </StatsShell>
    );
  }

  let overview: CourseOverviewDto;
  try {
    overview = await getCourseOverviewService(selected);
  } catch {
    redirect("/course/stats");
  }

  return (
    <StatsShell
      showAdmin={showAdmin}
      isInstructor={isInstructor}
      courseLabel={formatCourseLabel(overview.courseCode, overview.termCode)}
    >
      <div className="mt-10">
        <CourseOverviewPage overview={overview} />
      </div>
    </StatsShell>
  );
}
