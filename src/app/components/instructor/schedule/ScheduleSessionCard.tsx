"use client";

import type { CSSProperties } from "react";
import type { ScheduleSession } from "./types";

interface ScheduleSessionCardProps {
  session: ScheduleSession;
  style: CSSProperties;
  isSelected: boolean;
  compact?: boolean;
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

function SessionTypeLabel({ label }: { label: string }) {
  const twoLineMatch = label.match(/^(Debugging|Topic)\s+(Queue|Group)$/);
  if (twoLineMatch) {
    return (
      <p className="text-[10px] font-semibold tracking-[0.14em] opacity-85">
        <span className="block leading-none">{twoLineMatch[1]}</span>
        <span className="mt-px block leading-none">{twoLineMatch[2]}</span>
      </p>
    );
  }

  return (
    <p className="text-[11px] font-semibold leading-tight tracking-[0.18em] opacity-85">
      {label}
    </p>
  );
}

export function ScheduleSessionCard({
  session,
  style,
  isSelected,
  compact = false,
  onSelect,
}: ScheduleSessionCardProps) {
  const variant = sessionStyles[session.accent];

  return (
    <button
      type="button"
      style={style}
      onClick={() => onSelect(session.id)}
      className={`relative z-10 overflow-hidden rounded-2xl border px-3 text-left shadow-[0_18px_36px_-24px_rgba(7,31,65,0.7)] transition hover:-translate-y-0.5 ${compact ? "py-2" : "py-3"} ${variant.card} ${
        isSelected
          ? "border-white/80 ring-2 ring-[#c8102e]/75 ring-offset-2 ring-offset-[#fbfdff] shadow-[0_24px_48px_-24px_rgba(7,31,65,0.9)]"
          : "border-slate-200/40"
      }`}
    >
      <span
        className={`absolute inset-y-0 left-0 w-1.5 rounded-l-2xl ${variant.accent}`}
      />

      <div
        className={`ml-1.5 flex h-full min-h-0 flex-col justify-between whitespace-normal break-words ${compact ? "gap-1.5" : "gap-3"}`}
      >
        <SessionTypeLabel label={session.calendarLabel} />

        <div className={compact ? "space-y-1" : "space-y-2"}>
          <p
            className={`whitespace-normal break-words font-semibold leading-tight ${compact ? "text-xs" : "text-sm"}`}
          >
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
