"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  CALENDAR_HOUR_HEIGHT,
  sessionGridPlacement,
} from "@/lib/scheduling/time";
import { ScheduleSessionCard } from "./ScheduleSessionCard";
import type { CalendarDay, ScheduleSession, TimeSlot } from "./types";

interface WeeklyCalendarProps {
  days: CalendarDay[];
  timeSlots: TimeSlot[];
  sessions: ScheduleSession[];
  selectedSessionId: string;
  onSelectSession: (sessionId: string) => void;
  weekLabel?: string;
  onPreviousWeek?: () => void;
  onNextWeek?: () => void;
}

const HALF_HOUR_ROW_HEIGHT = CALENDAR_HOUR_HEIGHT / 2;
const SESSION_CARD_VERTICAL_MARGIN = 8;
const MINIMUM_SESSION_CARD_HEIGHT = 116;

export function WeeklyCalendar({
  days,
  timeSlots,
  sessions,
  selectedSessionId,
  onSelectSession,
  weekLabel = "Week View",
  onPreviousWeek,
  onNextWeek,
}: WeeklyCalendarProps) {
  return (
    <section className="rounded-[30px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_50px_-30px_rgba(15,41,66,0.35)] sm:p-6">
      <div className="mb-5 space-y-1">
        <h2 className="text-xl font-semibold text-[#071f41]">{weekLabel}</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous week"
            onClick={onPreviousWeek}
            disabled={!onPreviousWeek}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next week"
            onClick={onNextWeek}
            disabled={!onNextWeek}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-[#fbfdff]">
        <div className="max-h-[760px] overflow-auto">
          <div
            className="min-w-full"
            style={{ minWidth: `${96 + days.length * 132}px` }}
          >
            <div
              className="grid"
              style={{
                gridTemplateColumns: `96px repeat(${days.length}, minmax(132px, 1fr))`,
                gridTemplateRows: `72px repeat(${timeSlots.length * 2}, ${HALF_HOUR_ROW_HEIGHT}px)`,
              }}
            >
              <div className="sticky left-0 top-0 z-40 border-b border-r border-slate-200/80 bg-white/95 backdrop-blur" />

              {days.map((day, dayIndex) => (
                <div
                  key={day.key}
                  className="sticky top-0 z-30 flex items-center justify-center border-b border-slate-200/80 bg-white/95 px-2 text-center backdrop-blur"
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
                  className="sticky left-0 z-20 border-r border-t border-slate-200/80 bg-white/95 px-3 pt-3 text-xs font-medium text-slate-500 backdrop-blur"
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
                      dayIndex < days.length - 1
                        ? "border-r border-r-slate-200/70"
                        : ""
                    } ${rowIndex % 2 === 0 ? "bg-white/60" : "bg-[#f8fbff]"}`}
                    style={{
                      gridColumn: dayIndex + 2,
                      gridRow: rowIndex + 2,
                    }}
                  />
                )),
              )}

              {sessions.map((session) => {
                const dayIndex = days.findIndex(
                  (day) => day.key === session.day,
                );
                if (dayIndex < 0) {
                  return null;
                }
                const { rowStart, rowSpan, topOffsetPx, durationHalfHours } =
                  sessionGridPlacement(session.startHour, session.endHour);
                const durationHeight =
                  durationHalfHours * HALF_HOUR_ROW_HEIGHT -
                  SESSION_CARD_VERTICAL_MARGIN * 2;

                return (
                  <ScheduleSessionCard
                    key={session.id}
                    session={session}
                    isSelected={session.id === selectedSessionId}
                    onSelect={onSelectSession}
                    style={{
                      gridColumn: dayIndex + 2,
                      gridRow: `${rowStart} / span ${rowSpan}`,
                      margin: `${SESSION_CARD_VERTICAL_MARGIN}px`,
                      marginTop: `${SESSION_CARD_VERTICAL_MARGIN + topOffsetPx}px`,
                      minHeight: `${Math.max(
                        durationHeight,
                        MINIMUM_SESSION_CARD_HEIGHT,
                      )}px`,
                      alignSelf: "start",
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
