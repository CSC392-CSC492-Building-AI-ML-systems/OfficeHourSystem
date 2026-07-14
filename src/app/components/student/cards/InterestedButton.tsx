"use client";

import { useState, useTransition } from "react";
import { recordInterest } from "@/actions/ohInterests";

type InterestedButtonProps = {
  sessionId: number;
  initiallyInterested?: boolean;
};

export function InterestedButton({
  sessionId,
  initiallyInterested = false,
}: InterestedButtonProps) {
  const [isInterested, setIsInterested] = useState(initiallyInterested);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (isInterested || isPending) return;

    startTransition(async () => {
      try {
        await recordInterest(sessionId);
        setIsInterested(true);
      } catch {
        // Keep button clickable so the student can retry.
      }
    });
  };

  return (
    <button
      type="button"
      aria-pressed={isInterested}
      disabled={isInterested || isPending}
      onClick={handleClick}
      className={`shrink-0 rounded-full border px-3.5 py-2 text-sm font-medium transition ${
        isInterested
          ? "cursor-not-allowed border-[#071f41] bg-[#071f41] text-white shadow-[0_12px_24px_-18px_rgba(7,31,65,0.8)]"
          : "border-slate-200 bg-white text-[#071f41] hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      {isInterested
        ? "Already interested"
        : isPending
          ? "Saving…"
          : "I'm interested"}
    </button>
  );
}
