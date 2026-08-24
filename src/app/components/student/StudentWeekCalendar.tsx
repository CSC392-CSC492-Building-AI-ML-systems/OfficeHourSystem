"use client";

import { useState } from "react";
import { getStudentScheduleWeekAction } from "@/actions/scheduling";
import { TIME_SLOTS } from "@/app/components/instructor/schedule/data";
import { WeeklyCalendar } from "@/app/components/instructor/schedule/WeeklyCalendar";
import { LocationText } from "@/app/components/student/LocationText";
import type {
  CalendarDay,
  ScheduleSession,
} from "@/app/components/instructor/schedule/types";
import { formatDateOnlyLocal, startOfWeekMonday } from "@/lib/scheduling/time";

type WeekPayload = {
  weekStart: string;
  weekLabel: string;
  calendarDays: CalendarDay[];
  sessions: ScheduleSession[];
};

type Props = {
  offeringPublicId: string;
  initialWeek: WeekPayload;
  currentUserPublicId: string | null;
};

export function StudentWeekCalendar({
  offeringPublicId,
  initialWeek,
  currentUserPublicId,
}: Props) {
  const [week, setWeek] = useState(initialWeek);
  const [selectedSessionId, setSelectedSessionId] = useState(
    initialWeek.sessions[0]?.id ?? "",
  );
  const [error, setError] = useState<string | null>(null);

  const selected =
    week.sessions.find((session) => session.id === selectedSessionId) ?? null;

  const loadWeek = async (weekStart?: string) => {
    const data = await getStudentScheduleWeekAction({
      offeringPublicId,
      weekStart,
    });
    const next = {
      weekStart: data.weekStart,
      weekLabel: data.weekLabel,
      calendarDays: data.calendarDays,
      sessions: data.sessions,
    };
    setWeek(next);
    setSelectedSessionId((current) =>
      current && next.sessions.some((session) => session.id === current)
        ? current
        : (next.sessions[0]?.id ?? ""),
    );
  };

  const shiftWeek = (direction: -1 | 1) => {
    const current = new Date(`${week.weekStart}T00:00:00`);
    current.setDate(current.getDate() + direction * 7);
    void loadWeek(formatDateOnlyLocal(current)).catch((loadError) => {
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load week.",
      );
    });
  };

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-2xl border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm text-[#991b1b]">
          {error}
        </p>
      ) : null}

      <WeeklyCalendar
        days={week.calendarDays}
        timeSlots={TIME_SLOTS}
        sessions={week.sessions}
        selectedSessionId={selectedSessionId}
        currentUserPublicId={currentUserPublicId}
        onSelectSession={setSelectedSessionId}
        weekLabel={week.weekLabel}
        weekStart={week.weekStart}
        onPreviousWeek={() => shiftWeek(-1)}
        onNextWeek={() => shiftWeek(1)}
        onGoToThisWeek={() => {
          void loadWeek(
            formatDateOnlyLocal(startOfWeekMonday(new Date())),
          ).catch((loadError) => {
            setError(
              loadError instanceof Error
                ? loadError.message
                : "Failed to load week.",
            );
          });
        }}
      />

      {selected ? (
        <div className="rounded-[24px] border border-slate-200/80 bg-white px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            {selected.sessionTypeLabel}
          </p>
          <h3 className="mt-1 text-base font-semibold text-[#071f41]">
            {selected.title}
          </h3>
          {selected.sessionTypeLabel === "Custom" && selected.description ? (
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {selected.description}
            </p>
          ) : null}
          <p className="mt-1 text-sm text-slate-600">
            {selected.dateLabel}, {selected.startTime} – {selected.endTime}
            {selected.location ? (
              <>
                {" · "}
                <LocationText value={selected.location} className="break-all" />
              </>
            ) : null}
          </p>
        </div>
      ) : null}
    </div>
  );
}
