"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { ScheduleSessionCard } from "./ScheduleSessionCard";
import type { CalendarDay, ScheduleSession, TimeSlot } from "./types";

interface WeeklyCalendarProps {
  days: CalendarDay[];
  timeSlots: TimeSlot[];
  sessions: ScheduleSession[];
  selectedSessionId: string;
  onSelectSession: (sessionId: string) => void;
}

const CALENDAR_HOUR_HEIGHT = 120;
const HALF_HOUR_ROW_HEIGHT = CALENDAR_HOUR_HEIGHT / 2;
const HALF_HOUR_START = 9;

export function WeeklyCalendar({
  days,
  timeSlots,
  sessions,
  selectedSessionId,
  onSelectSession,
}: WeeklyCalendarProps) {
  return (
    <section className="rounded-[30px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_50px_-30px_rgba(15,41,66,0.35)] sm:p-6">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-[#071f41]">
            Week of Oct 23 - 29
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous week"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next week"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <span className="inline-flex w-fit rounded-full border border-slate-200 bg-[#f8fafc] px-4 py-2 text-sm font-medium text-[#071f41]">
          Week View
        </span>
      </div>

      <div className="overflow-auto">
        <div className="min-w-[920px]">
          <div
            className="grid rounded-[24px] border border-slate-200/80 bg-[#fbfdff]"
            style={{
              gridTemplateColumns: "88px repeat(7, minmax(120px, 1fr))",
              gridTemplateRows: `56px repeat(${timeSlots.length * 2}, ${HALF_HOUR_ROW_HEIGHT}px)`,
            }}
          >
            <div className="border-b border-r border-slate-200/80 bg-white/90" />

            {days.map((day, dayIndex) => (
              <div
                key={day.key}
                className="flex items-center justify-center border-b border-slate-200/80 bg-white/90 text-center"
                style={{ gridColumn: dayIndex + 2, gridRow: 1 }}
              >
                <div>
                  <p className="text-xs font-semibold tracking-[0.18em] text-slate-500">
                    {day.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#071f41]">
                    {day.date}
                  </p>
                </div>
              </div>
            ))}

            {timeSlots.map((slot, index) => (
              <div
                key={slot.label}
                className="border-r border-t border-slate-200/80 px-3 pt-3 text-xs font-medium text-slate-500"
                style={{
                  gridColumn: 1,
                  gridRow: `${2 + index * 2} / span 2`,
                }}
              >
                {slot.label}
              </div>
            ))}

            {Array.from({ length: timeSlots.length * 2 }).map((_, rowIndex) =>
              days.map((day, dayIndex) => (
                <div
                  key={`${day.key}-${rowIndex}`}
                  className={`border-t border-slate-200/70 ${
                    dayIndex < days.length - 1 ? "border-r" : ""
                  } ${rowIndex % 2 === 0 ? "bg-white/60" : "bg-[#f8fbff]"}`}
                  style={{
                    gridColumn: dayIndex + 2,
                    gridRow: rowIndex + 2,
                  }}
                />
              )),
            )}

            {sessions.map((session) => {
              const dayIndex = days.findIndex((day) => day.key === session.day);
              const rowStart = 2 + (session.startHour - HALF_HOUR_START) * 2;
              const rowSpan = (session.endHour - session.startHour) * 2;

              return (
                <ScheduleSessionCard
                  key={session.id}
                  session={session}
                  isSelected={session.id === selectedSessionId}
                  onSelect={onSelectSession}
                  style={{
                    gridColumn: dayIndex + 2,
                    gridRow: `${rowStart} / span ${rowSpan}`,
                    margin: "8px",
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
