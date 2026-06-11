"use client";

import type { CSSProperties } from "react";
import type { ScheduleSession } from "./types";

interface ScheduleSessionCardProps {
  session: ScheduleSession;
  style: CSSProperties;
  isSelected: boolean;
  onSelect: (sessionId: string) => void;
}

const sessionStyles = {
  "navy-yellow": {
    card: "bg-[#071f41] text-white",
    accent: "bg-[#f4d84d]",
  },
  "navy-red": {
    card: "bg-[#071f41] text-white",
    accent: "bg-[#c8102e]",
  },
  yellow: {
    card: "bg-[#f4d84d] text-[#071f41]",
    accent: "bg-[#d6b300]",
  },
} as const;

export function ScheduleSessionCard({
  session,
  style,
  isSelected,
  onSelect,
}: ScheduleSessionCardProps) {
  const variant = sessionStyles[session.accent];

  return (
    <button
      type="button"
      style={style}
      onClick={() => onSelect(session.id)}
      className={`relative z-10 overflow-hidden rounded-2xl border px-3 py-3 text-left shadow-[0_18px_36px_-24px_rgba(7,31,65,0.7)] transition hover:-translate-y-0.5 ${variant.card} ${
        isSelected
          ? "border-white/80 ring-2 ring-[#c8102e]/75 ring-offset-2 ring-offset-[#fbfdff] shadow-[0_24px_48px_-24px_rgba(7,31,65,0.9)]"
          : "border-slate-200/40"
      }`}
    >
      <span
        className={`absolute inset-y-0 left-0 w-1.5 rounded-l-2xl ${variant.accent}`}
      />

      <div className="ml-1.5 flex h-full flex-col justify-between gap-3 whitespace-normal break-words">
        <p className="text-[11px] font-semibold tracking-[0.18em] opacity-85">
          {session.calendarLabel}
        </p>

        <div className="space-y-2">
          <p className="whitespace-normal break-words text-sm font-semibold leading-tight">
            {session.title}
          </p>
          {session.hasOverride ? (
            <span className="inline-flex w-fit rounded-full bg-white/20 px-2 py-1 text-[10px] font-medium leading-none">
              Override
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}
