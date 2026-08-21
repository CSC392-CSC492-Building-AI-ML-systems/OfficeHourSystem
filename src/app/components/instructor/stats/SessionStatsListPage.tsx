"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  ChevronRight,
  LayoutGrid,
  MapPin,
  RefreshCw,
  Users,
} from "lucide-react";

import { Navbar } from "../Navbar";
import { getOfferingSessionStatsAction } from "@/actions/course_stats/course-stats";
import type { CourseStatsSessionDto } from "@/lib/types/queue";
import { formatCourseLabel } from "@/lib/courseLabel";

function na(value: number | null): string {
  return value === null ? "NA" : String(value);
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-[#f8fafc] px-3 py-3">
      <span className="text-2xl font-bold text-[#071f41]">{value}</span>
      <span className="mt-1 text-center text-xs text-slate-500">{label}</span>
    </div>
  );
}

function StatsCard({
  session,
  termCode,
}: {
  session: CourseStatsSessionDto;
  termCode: string;
}) {
  return (
    <article className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_16px_44px_-32px_rgba(15,41,66,0.35)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c8102e]">
        {formatCourseLabel(session.courseCode, termCode)}
      </p>
      <h3 className="mt-2 text-xl font-semibold text-[#071f41]">
        {session.title}
      </h3>

      <div className="mt-3 space-y-1.5 text-sm text-slate-600">
        <p className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-slate-400" />
          {formatRange(session.startsAt, session.endsAt)}
        </p>
        <p className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-slate-400" />
          {session.location}
        </p>
        <p className="flex items-center gap-2">
          <Users className="h-4 w-4 text-slate-400" />
          Host:{" "}
          {session.hostNames.length > 0 ? session.hostNames.join(", ") : "NA"}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-2">
        <Metric label="Checked in" value={na(session.checkedIn)} />
        <Metric label="Got help" value={na(session.gotHelp)} />
        <Metric label="Interested" value={na(session.interested)} />
        <Metric
          label="Interested & came"
          value={na(session.interestedShowed)}
        />
      </div>

      <Link
        href={`/course/stats/session?session=${session.sessionPublicId}`}
        className="mt-5 inline-flex items-center gap-1 rounded-full bg-[#071f41] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f2942]"
      >
        View details <ChevronRight className="h-4 w-4" />
      </Link>
    </article>
  );
}

export default function SessionStatsListPage({
  offeringPublicId,
  courseCode,
  termCode,
  initialSessions,
}: {
  offeringPublicId: string;
  courseCode: string;
  termCode: string;
  initialSessions: CourseStatsSessionDto[];
}) {
  const [sessions, setSessions] = useState(initialSessions);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    setError(null);
    try {
      const result = await getOfferingSessionStatsAction(offeringPublicId);
      setSessions(result.sessions);
    } catch {
      setError("Session expired or refresh failed. Please reload.");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <Navbar
          offeringPublicId={offeringPublicId}
          courseLabel={formatCourseLabel(courseCode, termCode)}
        />

        <main className="mt-10 space-y-8">
          <Link
            href="/course/stats"
            className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-[#071f41]"
          >
            Choose another course
          </Link>

          <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c8102e]">
                {formatCourseLabel(courseCode, termCode)}
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-[#071f41] sm:text-[2.1rem]">
                Per-session data
              </h1>
              <p className="text-base text-slate-600">
                Per-session Help Centre office-hour stats.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/course/stats?offering=${offeringPublicId}`}
                className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#071f41] transition hover:border-slate-300"
              >
                <LayoutGrid className="h-4 w-4" />
                Course overview
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
          </section>

          {error ? (
            <p className="rounded-2xl border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm text-[#991b1b]">
              {error}
            </p>
          ) : null}

          {sessions.length === 0 ? (
            <p className="rounded-[28px] border border-slate-200/80 bg-white px-6 py-16 text-center text-sm text-slate-500">
              No Help Centre office hours found for this course yet.
            </p>
          ) : (
            <section className="grid gap-5 lg:grid-cols-2">
              {sessions.map((s) => (
                <StatsCard
                  key={s.sessionPublicId}
                  session={s}
                  termCode={termCode}
                />
              ))}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
