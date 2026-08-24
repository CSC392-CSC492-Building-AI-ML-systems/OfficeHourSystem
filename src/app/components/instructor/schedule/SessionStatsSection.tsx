"use client";

import { useMemo, useState } from "react";
import { Clock, Mail, Search } from "lucide-react";

import { getSessionInterestedStudentsAction } from "@/actions/scheduling";
import type { SessionInterestedStudentDto } from "@/lib/queries/officehourInterest";
import type { ScheduleSession } from "./types";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatInterestedAt(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

type SessionStatsSectionProps = {
  session: ScheduleSession;
};

export function SessionStatsSection({ session }: SessionStatsSectionProps) {
  const [showInterested, setShowInterested] = useState(false);
  const [students, setStudents] = useState<SessionInterestedStudentDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filteredStudents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return students;

    return students.filter((student) =>
      [student.name, student.utorid, student.email]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query, students]);

  const handleToggleInterested = async () => {
    if (showInterested) {
      setShowInterested(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setStudents(await getSessionInterestedStudentsAction(session.id));
      setShowInterested(true);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load interested students.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_50px_-30px_rgba(15,41,66,0.35)]">
      <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500">
        SESSION STATS
      </p>
      <h2 className="mt-1 text-xl font-semibold text-[#071f41]">
        {session.title}
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        {session.dateLabel}, {session.startTime} – {session.endTime}
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="flex flex-col items-center rounded-2xl bg-[#f8fafc] px-3 py-4">
          <span className="text-3xl font-bold text-[#071f41]">
            {session.interestedCount}
          </span>
          <span className="mt-1 text-center text-xs text-slate-500">
            I&apos;m Interested presses
          </span>
          <button
            type="button"
            onClick={() => void handleToggleInterested()}
            disabled={loading}
            className="mt-2 text-xs font-medium text-[#1e4fa1] transition hover:text-[#071f41] hover:underline disabled:opacity-50"
          >
            {loading ? "Loading…" : showInterested ? "Hide list" : "See who"}
          </button>
        </div>
        <div className="flex flex-col items-center rounded-2xl bg-[#f8fafc] px-3 py-4">
          <span className="text-3xl font-bold text-[#071f41]">
            {session.checkedInCount}
          </span>
          <span className="mt-1 text-center text-xs text-slate-500">
            Checked in
          </span>
        </div>
      </div>

      {error ? (
        <p className="mt-3 rounded-2xl border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm text-[#991b1b]">
          {error}
        </p>
      ) : null}

      {showInterested ? (
        <div className="mt-4 rounded-[24px] border border-slate-200/80 bg-[#f8fafc] p-4">
          <label className="relative mb-4 block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search students..."
              className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#071f41]"
            />
          </label>

          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {filteredStudents.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">
                {students.length === 0
                  ? "No students have marked interest yet."
                  : "No students match your search."}
              </p>
            ) : (
              filteredStudents.map((student) => (
                <div
                  key={`${student.utorid}-${student.interestedAt}`}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3"
                >
                  <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eaf1ff] text-sm font-semibold text-[#071f41]">
                    {getInitials(student.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-[#071f41]">
                      {student.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {student.utorid}
                    </p>
                    {student.email ? (
                      <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-slate-500">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        {student.email}
                      </p>
                    ) : null}
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      Interested {formatInterestedAt(student.interestedAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Showing {filteredStudents.length} of {students.length} students
          </p>
        </div>
      ) : null}
    </section>
  );
}
