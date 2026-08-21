"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarClock, Clock, MapPin, RefreshCw, Users } from "lucide-react";

import { Navbar } from "../Navbar";
import { getSessionStatsDetailAction } from "@/actions/course_stats/session-detail";
import type {
  SessionStatsDetailDto,
  SessionStatsStudentDto,
} from "@/lib/types/queue";
import { formatCourseLabel } from "@/lib/courseLabel";

// Show a number, or "NA" when it couldn't be computed.
function na(value: number | null): string {
  return value === null ? "NA" : `${value}`;
}

function formatRange(startsAt: string, endsAt: string): string {
  const opts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };
  const date = new Date(startsAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const start = new Date(startsAt).toLocaleTimeString("en-US", opts);
  const end = new Date(endsAt).toLocaleTimeString("en-US", opts);
  return `${date} · ${start} – ${end}`;
}

function StudentGroup({ student }: { student: SessionStatsStudentDto }) {
  return (
    <article className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_12px_36px_-28px_rgba(15,41,66,0.3)]">
      {/* Group header — per-student rollup */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-[#071f41]">
            {student.studentName}
          </h3>
          <p className="text-xs text-slate-500">
            Student #: {student.studentNumber ?? "NA"}
          </p>
        </div>
        <div className="flex gap-2 text-xs font-semibold">
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

      {/* Per-visit detail rows */}
      <ul className="mt-4 space-y-2 border-t border-slate-100 pt-3">
        {student.visits.map((v, i) => (
          <li
            key={i}
            className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-600"
          >
            <span className="text-slate-400">#{i + 1}</span>
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-slate-400" />
              Helped by {v.helperName ?? "NA"}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              Help {na(v.helpMinutes)} min
            </span>
            <span className="flex items-center gap-1.5">
              Wait {na(v.waitMinutes)} min
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

export default function SessionStatsDetailPage({
  initialDetail,
}: {
  initialDetail: SessionStatsDetailDto;
}) {
  const [detail, setDetail] = useState(initialDetail);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    setError(null);
    try {
      setDetail(await getSessionStatsDetailAction(detail.sessionPublicId));
    } catch {
      setError("Session expired or refresh failed. Please reload.");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="mx-auto flex w-full max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <Navbar
          offeringPublicId={detail.offeringPublicId}
          courseLabel={formatCourseLabel(detail.courseCode, detail.termCode)}
        />

        <main className="mt-10 space-y-8">
          <Link
            href={`/course/stats/sessions?offering=${detail.offeringPublicId}`}
            className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-[#071f41]"
          >
            Back to per-session data
          </Link>

          <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c8102e]">
                {formatCourseLabel(detail.courseCode, detail.termCode)}
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-[#071f41]">
                {detail.title}
              </h1>
              <div className="space-y-1 text-sm text-slate-600">
                <p className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-slate-400" />
                  {formatRange(detail.startsAt, detail.endsAt)}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  {detail.location}
                </p>
                <p className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-400" />
                  Host:{" "}
                  {detail.hostNames.length > 0
                    ? detail.hostNames.join(", ")
                    : "NA"}
                </p>
              </div>
            </div>
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
          </section>

          {error ? (
            <p className="rounded-2xl border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm text-[#991b1b]">
              {error}
            </p>
          ) : null}

          {detail.students.length === 0 ? (
            <p className="rounded-[24px] border border-slate-200/80 bg-white px-6 py-16 text-center text-sm text-slate-500">
              No attendance records for this session yet.
            </p>
          ) : (
            <section className="space-y-4">
              {detail.students.map((s, i) => (
                <StudentGroup key={i} student={s} />
              ))}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
