"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Navbar } from "./Navbar";
import { SessionRow } from "./cards/SessionRow";
import { StudentWeekCalendar } from "./StudentWeekCalendar";
import type {
  CalendarDay,
  ScheduleSession,
} from "@/app/components/instructor/schedule/types";
import type { StudentDashboardSessionDto } from "@/services/student_dashboard/student-dashboard";

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function formatDayHeader(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  const monthDay = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  if (isToday) return `Today · ${weekday} ${monthDay}`;
  return `${weekday} · ${monthDay}`;
}

function formatTimeRange(startsAt: string, endsAt: string) {
  const opts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };
  return `${new Date(startsAt).toLocaleTimeString("en-US", opts)} – ${new Date(endsAt).toLocaleTimeString("en-US", opts)}`;
}

function groupSessionsByDay(sessions: StudentDashboardSessionDto[]) {
  const groups: {
    key: string;
    label: string;
    sessions: StudentDashboardSessionDto[];
  }[] = [];
  const indexByKey = new Map<string, number>();

  for (const session of sessions) {
    const key = dayKey(session.startsAt);
    const existing = indexByKey.get(key);
    if (existing === undefined) {
      indexByKey.set(key, groups.length);
      groups.push({
        key,
        label: formatDayHeader(session.startsAt),
        sessions: [session],
      });
    } else {
      groups[existing].sessions.push(session);
    }
  }

  return groups;
}

type Props = {
  firstName: string;
  sessions: StudentDashboardSessionDto[];
  courseLabel?: string;
  offeringPublicId: string;
  currentUserPublicId: string | null;
  initialWeek: {
    weekStart: string;
    weekLabel: string;
    calendarDays: CalendarDay[];
    sessions: ScheduleSession[];
  };
};

function SessionSection({
  title,
  hint,
  sessions,
  empty,
  tall,
}: {
  title: string;
  hint: string;
  sessions: StudentDashboardSessionDto[];
  empty: string;
  tall?: boolean;
}) {
  const days = groupSessionsByDay(sessions);

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-[#071f41]">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{hint}</p>
      </div>
      {days.length === 0 ? (
        <p className="rounded-3xl border border-slate-200/80 bg-white px-6 py-8 text-center text-sm text-slate-400">
          {empty}
        </p>
      ) : (
        <div
          className={`${
            tall ? "max-h-[min(42rem,70vh)]" : "max-h-[min(32rem,60vh)]"
          } overflow-y-auto overscroll-contain rounded-3xl border border-slate-200/80 bg-white shadow-[0_18px_50px_-30px_rgba(15,41,66,0.35)]`}
        >
          {days.map((day, dayIndex) => (
            <div key={day.key}>
              <h3 className="sticky top-0 z-10 bg-white px-4 pb-3 pt-4 text-sm font-semibold uppercase tracking-widest text-[#071f41] sm:px-5 sm:pt-5">
                {day.label}
              </h3>
              <div
                className={`space-y-3 px-4 sm:px-5 ${
                  dayIndex === days.length - 1 ? "pb-4 sm:pb-5" : "pb-6"
                }`}
              >
                {day.sessions.map((s) => (
                  <SessionRow
                    key={s.sessionPublicId}
                    sessionId={s.sessionId}
                    type={s.type}
                    courseLabel={s.courseLabel}
                    title={s.title}
                    description={s.description}
                    time={formatTimeRange(s.startsAt, s.endsAt)}
                    location={s.location}
                    isInterested={s.isInterested}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function StudentDashboard({
  firstName,
  sessions,
  courseLabel,
  offeringPublicId,
  currentUserPublicId,
  initialWeek,
}: Props) {
  const [showCalendar, setShowCalendar] = useState(false);

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <Navbar courseLabel={courseLabel} />

        <main className="mt-6 space-y-8">
          <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-[#071f41] sm:text-[2.1rem]">
                {courseLabel ?? "Course"}
              </h1>
              <p className="text-base text-slate-600">
                Welcome back, {firstName}!
              </p>
            </div>
            <button
              type="button"
              aria-pressed={showCalendar}
              onClick={() => setShowCalendar((open) => !open)}
              className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-[#071f41] shadow-[0_14px_30px_-20px_rgba(7,31,65,0.35)] transition hover:border-slate-300 hover:bg-slate-50 sm:self-auto"
            >
              <CalendarDays className="h-4 w-4" />
              {showCalendar ? "Hide calendar" : "Show calendar"}
            </button>
          </section>

          {showCalendar ? (
            <StudentWeekCalendar
              offeringPublicId={offeringPublicId}
              initialWeek={initialWeek}
              currentUserPublicId={currentUserPublicId}
            />
          ) : null}

          <SessionSection
            title="Upcoming office hours"
            hint="Sessions for this course over the next two weeks."
            sessions={sessions}
            empty="No office hours scheduled for the next two weeks."
            tall={!showCalendar}
          />
        </main>
      </div>
    </div>
  );
}
