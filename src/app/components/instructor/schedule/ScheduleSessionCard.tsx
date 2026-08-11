"use client";

import type { CSSProperties } from "react";
import type { ScheduleSession } from "./types";

interface ScheduleSessionCardProps {
  session: ScheduleSession;
  style: CSSProperties;
  isSelected: boolean;
  isHostedByCurrentUser?: boolean;
  compact?: boolean;
  onSelect: (sessionId: string) => void;
}

const sessionStyles = {
  "navy-yellow": {
    card: "bg-[#071f41] text-white",
    accent: "bg-[#f4d84d]",
    hostHighlight: {
      card: "border-[3px] border-[#f4d84d] shadow-[0_0_0_1px_rgba(244,216,77,0.5),0_20px_40px_-16px_rgba(244,216,77,0.55)]",
      accent: "w-3 bg-[#f4d84d]",
      badge: "bg-[#f4d84d] text-[#071f41]",
    },
  },
  "navy-red": {
    card: "bg-[#071f41] text-white",
    accent: "bg-[#c8102e]",
    hostHighlight: {
      card: "border-[3px] border-[#f4d84d] shadow-[0_0_0_1px_rgba(244,216,77,0.5),0_20px_40px_-16px_rgba(244,216,77,0.55)]",
      accent: "w-3 bg-[#f4d84d]",
      badge: "bg-[#f4d84d] text-[#071f41]",
    },
  },
  yellow: {
    card: "bg-[#f4d84d] text-[#071f41]",
    accent: "bg-[#d6b300]",
    hostHighlight: {
      card: "border-[3px] border-[#071f41] shadow-[0_0_0_1px_rgba(7,31,65,0.25),0_20px_40px_-16px_rgba(7,31,65,0.35)]",
      accent: "w-3 bg-[#071f41]",
      badge: "bg-[#071f41] text-[#f4d84d]",
    },
  },
} as const;

function SessionTypeLabel({ label }: { label: string }) {
  const twoLineMatch = label.match(
    /^(Help|Professor)\s+(Centre|Office Hours)$/,
  );
  if (twoLineMatch) {
    return (
      <p className="text-[10px] font-semibold tracking-[0.14em] opacity-85">
        <span className="block leading-none">{twoLineMatch[1]}</span>
        <span className="mt-px block leading-none">{twoLineMatch[2]}</span>
      </p>
    );
  }

  return (
    <p className="whitespace-nowrap text-[11px] font-semibold leading-tight tracking-[0.18em] opacity-85">
      {label}
    </p>
  );
}

export function ScheduleSessionCard({
  session,
  style,
  isSelected,
  isHostedByCurrentUser = false,
  compact = false,
  onSelect,
}: ScheduleSessionCardProps) {
  const variant = sessionStyles[session.accent];
  const hostText =
    session.hostLabel !== "Unassigned" ? session.hostLabel : "No host assigned";
  const isHosted = isHostedByCurrentUser;

  const cardClassName = isSelected
    ? isHosted
      ? `${variant.hostHighlight.card} ring-2 ring-[#c8102e]/75 ring-offset-2 ring-offset-[#fbfdff] shadow-[0_24px_48px_-24px_rgba(7,31,65,0.9)]`
      : "border-white/80 ring-2 ring-[#c8102e]/75 ring-offset-2 ring-offset-[#fbfdff] shadow-[0_24px_48px_-24px_rgba(7,31,65,0.9)]"
    : isHosted
      ? variant.hostHighlight.card
      : "border-slate-200/40";

  return (
    <button
      type="button"
      style={style}
      onClick={() => onSelect(session.id)}
      className={`relative z-10 overflow-hidden rounded-2xl border px-3 text-left shadow-[0_18px_36px_-24px_rgba(7,31,65,0.7)] transition hover:-translate-y-0.5 ${compact ? "py-2" : "py-3"} ${variant.card} ${cardClassName}`}
    >
      <span
        className={`absolute inset-y-0 left-0 rounded-l-2xl ${
          isHosted ? variant.hostHighlight.accent : `w-1.5 ${variant.accent}`
        }`}
      />

      <div
        className={`ml-1.5 flex h-full min-h-0 flex-col justify-between whitespace-normal break-words ${compact ? "gap-1.5" : "gap-3"}`}
      >
        <div className={compact ? "space-y-1" : "space-y-1.5"}>
          <SessionTypeLabel label={session.calendarLabel} />
          {isHosted ? (
            <span
              className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] ${variant.hostHighlight.badge}`}
            >
              Yours
            </span>
          ) : null}
        </div>

        <div className={compact ? "space-y-1" : "space-y-2"}>
          <p
            className={`whitespace-normal break-words font-semibold leading-tight ${compact ? "text-xs" : "text-sm"}`}
          >
            {session.title}
          </p>
          <p
            className={`truncate leading-tight ${compact ? "text-[10px]" : "text-[11px]"} ${
              isHostedByCurrentUser ? "font-semibold opacity-100" : "opacity-80"
            }`}
            title={hostText}
          >
            {isHostedByCurrentUser ? "Your session" : `${hostText}`}
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
