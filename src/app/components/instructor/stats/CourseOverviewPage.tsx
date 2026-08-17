"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, LayoutList, RefreshCw, Users } from "lucide-react";

import {
  getCourseOverviewAction,
  getCourseStudentDetailsAction,
} from "@/actions/course_stats/course-overview";
import type {
  CourseOverviewDto,
  CourseStudentDetailDto,
} from "@/lib/types/queue";

function num(value: number): string {
  return `${value}`;
}
function avg1(value: number | null): string {
  return value === null ? "NA" : value.toFixed(1);
}
function pct(ratio: number | null): string {
  return ratio === null ? "NA" : `${Math.round(ratio * 100)}%`;
}
function mins(value: number | null): string {
  return value === null ? "NA" : `${value.toFixed(1)} min`;
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-[#f8fafc] px-3 py-4 text-center">
      <span className="text-2xl font-bold text-[#071f41]">{value}</span>
      <span className="mt-1 text-xs text-slate-500">{label}</span>
      {hint ? (
        <span className="mt-0.5 text-[11px] text-slate-400">{hint}</span>
      ) : null}
    </div>
  );
}

function StudentCard({ student }: { student: CourseStudentDetailDto }) {
  return (
    <article className="rounded-lg border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-[#071f41]">
            {student.studentName}
          </h3>
          <p className="text-xs text-slate-500">
            Student #: {student.studentNumber ?? "NA"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-[#f8fafc] px-3 py-1 text-slate-600">
            {student.visitCount}× visits
          </span>
          <span className="rounded-full bg-[#eaf1ff] px-3 py-1 text-[#1e4fa1]">
            {student.totalHelpMinutes} min helped
          </span>
          <span className="rounded-full bg-[#fff7ed] px-3 py-1 text-[#9a3412]">
            {student.totalWaitMinutes} min waited
          </span>
        </div>
      </div>

      <ul className="mt-4 space-y-2 border-t border-slate-100 pt-3">
        {student.visits.map((v, i) => (
          <li
            key={i}
            className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-600"
          >
            <span className="text-slate-400">#{i + 1}</span>
            <span className="font-medium text-slate-700">{v.sessionTitle}</span>
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-slate-400" />
              {v.helperName ?? "NA"}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              Help {v.helpMinutes === null ? "NA" : `${v.helpMinutes} min`}
            </span>
            <span>
              Wait {v.waitMinutes === null ? "NA" : `${v.waitMinutes} min`}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
              {v.outcome}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function CourseOverviewPage({
  overview,
}: {
  overview: CourseOverviewDto;
}) {
  const [data, setData] = useState(overview);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [students, setStudents] = useState<CourseStudentDetailDto[] | null>(
    null,
  );
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    setError(null);
    try {
      setData(await getCourseOverviewAction(data.offeringPublicId));
      if (students !== null) {
        setStudents(await getCourseStudentDetailsAction(data.offeringPublicId));
      }
    } catch {
      setError("Session expired or refresh failed. Please reload.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleLoadDetails = async () => {
    if (loadingDetails) return;
    setLoadingDetails(true);
    setDetailsError(null);
    try {
      setStudents(await getCourseStudentDetailsAction(data.offeringPublicId));
    } catch {
      setDetailsError("Failed to load student details.");
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#c8102e]">
            {data.courseCode}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#071f41]">
            {data.termCode}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Based on {data.endedSessionCount} ended session
            {data.endedSessionCount === 1 ? "" : "s"} · {data.totalStudents}{" "}
            students enrolled.
          </p>
          <Link
            href="/course/stats"
            className="mt-3 inline-block text-sm font-semibold text-[#071f41] underline-offset-4 hover:underline"
          >
            Choose another course
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/course/stats/sessions?offering=${data.offeringPublicId}`}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#071f41] transition hover:border-slate-300"
          >
            <LayoutList className="h-4 w-4" />
            Per-session data
          </Link>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#071f41] transition hover:border-slate-300 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </header>

      {error ? (
        <p className="rounded-lg border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm text-[#991b1b]">
          {error}
        </p>
      ) : null}

      <section className="rounded-lg border border-slate-200/80 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.08)]">
        <h2 className="mb-1 text-lg font-semibold text-[#071f41]">
          Course totals
        </h2>
        <p className="mb-4 text-xs text-slate-400">
          Helped / checked-in / avg help / came are over ended sessions only.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Metric
            label="Students helped"
            value={num(data.studentsHelped)}
            hint={`${pct(data.helpedRatio)} of class`}
          />
          <Metric
            label="Interested"
            value={num(data.studentsInterested)}
            hint={`${pct(data.interestedRatio)} of class · ${data.interestRecords} students`}
          />
          <Metric label="Checked in" value={num(data.studentsCheckedIn)} />
          <Metric
            label="Interested → came"
            value={pct(data.interestedShowedRatio)}
          />
          <Metric label="Avg help time" value={mins(data.avgHelpMinutes)} />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200/80 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.08)]">
        <h2 className="mb-1 text-lg font-semibold text-[#071f41]">
          Per-session averages
        </h2>
        <p className="mb-4 text-xs text-slate-400">
          Averaged over ended (completed) sessions only.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Metric
            label="Helped / session"
            value={avg1(data.avgHelpedPerSession)}
          />
          <Metric
            label="Interested / session"
            value={avg1(data.avgInterestedPerSession)}
          />
          <Metric
            label="Checked in / session"
            value={avg1(data.avgCheckInsPerSession)}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#071f41]">
            Student details
          </h2>
          {students !== null ? (
            <button
              type="button"
              onClick={handleLoadDetails}
              disabled={loadingDetails}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#071f41] transition hover:border-slate-300 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${loadingDetails ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          ) : null}
        </div>

        {detailsError ? (
          <p className="rounded-lg border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm text-[#991b1b]">
            {detailsError}
          </p>
        ) : null}

        {students === null ? (
          <button
            type="button"
            onClick={handleLoadDetails}
            disabled={loadingDetails}
            className="w-full rounded-lg border-2 border-dashed border-[#071f41]/25 bg-white/60 px-6 py-10 text-sm font-semibold text-[#071f41] transition hover:border-[#071f41]/45 disabled:opacity-50"
          >
            {loadingDetails ? "Loading…" : "View student details"}
          </button>
        ) : students.length === 0 ? (
          <p className="rounded-lg bg-white px-6 py-12 text-center text-sm text-slate-500 shadow-sm">
            No attendance records for this course yet.
          </p>
        ) : (
          students.map((s, i) => <StudentCard key={i} student={s} />)
        )}
      </section>
    </div>
  );
}
