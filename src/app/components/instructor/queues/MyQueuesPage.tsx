"use client";

import { useEffect, useState } from "react";
import { CalendarDays, ChevronRight } from "lucide-react";
import { Navbar } from "../Navbar";
import { showUpcomingOhAction } from "@/actions/show_upcoming_oh/show-upcoming-oh";
import { DUMMY_QUEUE_SESSIONS } from "./data";
import { QueueSessionCard } from "./QueueSessionCard";
import type { QueueSession } from "./types";

type Tab = "upcoming" | "active" | "ended";

// Format two ISO strings into a readable time range e.g. "10:00 AM - 11:00 AM"
function formatSessionTime(startsAt: string, endsAt: string): string {
  const opts: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit", hour12: true };
  const start = new Date(startsAt).toLocaleTimeString([], opts);
  const end = new Date(endsAt).toLocaleTimeString([], opts);
  return `${start} - ${end}`;
}

export default function MyQueuesPage() {
  const [sessions, setSessions] = useState<QueueSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await showUpcomingOhAction();
        setSessions(
          data.map((session) => ({
            id: session.sessionPublicId,
            courseLabel: session.courseCode,
            title: session.title,
            time: formatSessionTime(session.startsAt, session.endsAt),
            location: session.location,
            isHighlighted: session.status === "ACTIVE",
            workspaceSubtitle: `${session.courseCode}: ${session.title}`,
            lastScanLabel: "No check-ins yet",
            status: session.status,
            endsAt: session.endsAt,
          })),
        );
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load queue sessions.",
        );
        setSessions(DUMMY_QUEUE_SESSIONS);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Split sessions into three buckets
  const upcomingSessions = sessions.filter((s) =>
    s.status === "SCHEDULED" || s.status === "DELAYED",
  );
  const activeSessions = sessions.filter((s) => s.status === "ACTIVE");
  const endedSessions  = sessions.filter((s) => s.status === "COMPLETED");

  const tabSessions: Record<Tab, QueueSession[]> = {
    upcoming: upcomingSessions,
    active:   activeSessions,
    ended:    endedSessions,
  };

  const tabLabels: Record<Tab, string> = {
    upcoming: `Upcoming (${upcomingSessions.length})`,
    active:   `Active (${activeSessions.length})`,
    ended:    `Ended (${endedSessions.length})`,
  };

  const emptyMessages: Record<Tab, string> = {
    upcoming: "No upcoming sessions today.",
    active:   "No active sessions right now.",
    ended:    "No ended sessions today.",
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <Navbar activeItem="queues" />

        <main className="mt-10 space-y-8">
          <section className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-[#071f41] sm:text-[2.1rem]">
              My Queues
            </h1>
            <p className="text-base text-slate-600">
              Launch your assigned queue sessions and keep live support moving.
            </p>
          </section>

          {error ? (
            <p className="rounded-2xl border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm text-[#991b1b]">
              {error} Showing sample data.
            </p>
          ) : null}

          <section className="rounded-[32px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_50px_-30px_rgba(15,41,66,0.35)] sm:p-8">
            {/* Top row */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef5ff] text-[#071f41]">
                  <CalendarDays className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-[#071f41]">
                    Today's Sessions
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Open the next session workspace when students begin checking in.
                  </p>
                </div>
              </div>

              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-[#f8fafc] px-4 py-2 text-sm font-medium text-[#071f41]">
                WEEKLY VIEW
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </span>
            </div>

            {/* Sub-tab navigation */}
            <div className="mt-6 flex gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
              {(["upcoming", "active", "ended"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    activeTab === tab
                      ? "bg-white text-[#071f41] shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tabLabels[tab]}
                </button>
              ))}
            </div>

            {/* Session cards */}
            {loading ? (
              <p className="mt-8 text-sm text-slate-500">Loading sessions…</p>
            ) : tabSessions[activeTab].length === 0 ? (
              <p className="mt-8 text-sm text-slate-500">{emptyMessages[activeTab]}</p>
            ) : (
              <div className="mt-8 grid gap-5 xl:grid-cols-2">
                {tabSessions[activeTab].map((session) => (
                  <QueueSessionCard key={session.id} session={session} />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
