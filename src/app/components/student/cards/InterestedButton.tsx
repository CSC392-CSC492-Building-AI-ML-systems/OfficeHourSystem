"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { recordInterest, retractInterest } from "@/actions/ohInterests";

type InterestedButtonProps = {
  sessionId: number;
  initiallyInterested?: boolean;
  demo?: boolean;
  onInterestChange?: (interested: boolean) => void;
};

export function InterestedButton({
  sessionId,
  initiallyInterested = false,
  demo = false,
  onInterestChange,
}: InterestedButtonProps) {
  const router = useRouter();
  const [isInterested, setIsInterested] = useState(initiallyInterested);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (isPending) return;

    const previous = isInterested;
    const next = !previous;
    setError(null);
    setIsInterested(next);
    onInterestChange?.(next);

    if (demo) {
      return;
    }

    startTransition(async () => {
      try {
        if (next) await recordInterest(sessionId);
        else await retractInterest(sessionId);
        router.refresh();
      } catch {
        setIsInterested(previous);
        onInterestChange?.(previous);
        setError("Could not update interest. Please try again.");
      }
    });
  };

  const label = isPending
    ? isInterested
      ? "Saving…"
      : "Updating…"
    : isInterested
      ? "Already interested"
      : "I'm interested";

  return (
    <div className="w-full shrink-0 text-left sm:w-auto sm:text-right">
      <button
        type="button"
        aria-pressed={isInterested}
        aria-label={isInterested ? "Retract interest" : "I'm interested"}
        disabled={isPending}
        onClick={handleClick}
        className={`w-full rounded-full border px-3.5 py-2 text-sm font-medium transition disabled:cursor-wait disabled:opacity-70 sm:w-auto ${
          isInterested
            ? "border-[#071f41] bg-[#071f41] text-white shadow-[0_12px_24px_-18px_rgba(7,31,65,0.8)] hover:bg-[#12345f]"
            : "border-slate-200 bg-white text-[#071f41] hover:border-slate-300 hover:bg-slate-50"
        }`}
      >
        {label}
      </button>
      {error ? (
        <p
          className="mt-1 max-w-full text-xs text-[#c8102e] sm:max-w-48"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
