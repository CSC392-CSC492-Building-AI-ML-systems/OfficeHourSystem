"use client";

import { useState, useTransition } from "react";
import { recordInterest, retractInterest } from "@/actions/ohInterests";

type InterestedButtonProps = {
  sessionId: number;
  initiallyInterested?: boolean;
  demo?: boolean;
};

export function InterestedButton({
  sessionId,
  initiallyInterested = false,
  demo = false,
}: InterestedButtonProps) {
  const [isInterested, setIsInterested] = useState(initiallyInterested);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (isPending) return;

    if (demo) {
      setIsInterested((current) => !current);
      return;
    }

    const nextInterested = !isInterested;
    startTransition(async () => {
      try {
        if (nextInterested) {
          await recordInterest(sessionId);
        } else {
          await retractInterest(sessionId);
        }
        setIsInterested(nextInterested);
      } catch {
        // Keep the previous state so the student can retry.
      }
    });
  };

  const label = isPending
    ? isInterested
      ? "Updating…"
      : "Saving…"
    : isInterested
      ? "Already interested"
      : "I'm interested";

  return (
    <button
      type="button"
      aria-pressed={isInterested}
      aria-label={isInterested ? "Retract interest" : "I'm interested"}
      disabled={isPending}
      onClick={handleClick}
      className={`shrink-0 rounded-full border px-3.5 py-2 text-sm font-medium transition ${
        isInterested
          ? "border-[#071f41] bg-[#071f41] text-white shadow-[0_12px_24px_-18px_rgba(7,31,65,0.8)] hover:bg-[#0f2942]"
          : "border-slate-200 bg-white text-[#071f41] hover:border-slate-300 hover:bg-slate-50"
      } disabled:cursor-not-allowed disabled:opacity-70`}
    >
      {label}
    </button>
  );
}
