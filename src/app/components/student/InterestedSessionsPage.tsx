"use client";

import { useState } from "react";
import { CalendarHeart } from "lucide-react";

import { SessionRow } from "@/app/components/student/cards/SessionRow";
import type { InterestedSessionDto } from "@/lib/queries/student_interest/student-interest";

function formatTimeRange(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const date = start.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
  };
  return `${date} · ${start.toLocaleTimeString("en-US", timeOptions)}–${end.toLocaleTimeString("en-US", timeOptions)}`;
}

export function InterestedSessionsPage({
  initialSessions,
}: {
  initialSessions: InterestedSessionDto[];
}) {
  const [sessions, setSessions] = useState(initialSessions);

  const updateSession = (
    session: InterestedSessionDto,
    interested: boolean,
  ) => {
    setSessions((current) => {
      if (!interested) {
        return current.filter(
          (item) => item.sessionPublicId !== session.sessionPublicId,
        );
      }
      if (
        current.some((item) => item.sessionPublicId === session.sessionPublicId)
      ) {
        return current;
      }
      return [...current, session].sort((a, b) =>
        a.startsAt.localeCompare(b.startsAt),
      );
    });
  };

  return (
    <main className="mt-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-[#071f41]">
          My Interested Office Hours
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Upcoming sessions you marked as interested. Click the button again to
          retract your response.
        </p>
      </header>

      {sessions.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-[28px] border border-slate-200 bg-white px-6 py-14 text-center shadow-[0_18px_50px_-36px_rgba(15,41,66,0.35)]">
          <CalendarHeart className="h-10 w-10 text-slate-300" aria-hidden />
          <h2 className="mt-4 text-lg font-semibold text-[#071f41]">
            No interested office hours
          </h2>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            Mark an upcoming office hour as interested from a course dashboard
            and it will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {sessions.map((session) => (
            <SessionRow
              key={session.sessionPublicId}
              sessionId={session.sessionId}
              type={session.type}
              courseLabel={session.courseLabel}
              title={session.title}
              time={formatTimeRange(session.startsAt, session.endsAt)}
              location={session.location}
              isInterested
              onInterestChange={(interested) =>
                updateSession(session, interested)
              }
            />
          ))}
        </div>
      )}
    </main>
  );
}
