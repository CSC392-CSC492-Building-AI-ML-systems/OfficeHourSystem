"use client";

import { useState } from "react";
import { Clock3, Dot, UserRound } from "lucide-react";
import type { QueueStudent } from "./types";

interface CurrentlyHelpingCardProps {
  currentlyHelping: QueueStudent | null;
  sessionSeconds: number;
  onNoShow: () => void;
  onEndHelp: () => void;
  onRevert: () => void;
}

function formatSessionDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

export function CurrentlyHelpingCard({
  currentlyHelping,
  sessionSeconds,
  onNoShow,
  onEndHelp,
  onRevert,
}: CurrentlyHelpingCardProps) {
  // Track which action is pending confirmation: null means normal state
  const [confirmingAction, setConfirmingAction] = useState<"end" | "no_show" | null>(null);

  const handleConfirm = () => {
    if (confirmingAction === "end") onEndHelp();
    if (confirmingAction === "no_show") onNoShow();
    setConfirmingAction(null);
  };

  const handleCancel = () => setConfirmingAction(null);

  return (
    <section className="rounded-[30px] border border-slate-200/80 bg-white shadow-[0_18px_50px_-30px_rgba(15,41,66,0.35)]">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-[0.14em] text-[#071f41]">
          <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
          <span>CURRENTLY HELPING</span>
        </div>

        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d7e7ff] bg-[#eef5ff] px-4 py-2 text-sm font-medium text-[#071f41]">
          <Clock3 className="h-4 w-4" />
          Session: {formatSessionDuration(sessionSeconds)}
        </span>
      </div>

      {currentlyHelping ? (
        <div className="space-y-5 px-6 py-6">
          <div className="flex items-start gap-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#071f41] text-base font-semibold text-white">
              {currentlyHelping.initials}
            </div>
            <div className="min-w-0 space-y-1">
              <h3 className="text-xl font-semibold text-[#071f41]">
                {currentlyHelping.name}
              </h3>
              <p className="flex items-center gap-1 text-sm text-slate-500">
                <UserRound className="h-4 w-4" />
                <span>{currentlyHelping.username}</span>
              </p>
            </div>
          </div>

          {confirmingAction ? (
            /* Confirmation prompt — replaces the action buttons to prevent accidental clicks */
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-medium text-amber-800">
                {confirmingAction === "end"
                  ? "End help for this student?"
                  : "Mark this student as no-show?"}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="inline-flex items-center justify-center rounded-full bg-[#071f41] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0f2942]"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Normal action buttons */
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setConfirmingAction("no_show")}
                className="inline-flex items-center justify-center rounded-full border border-[#c8102e] px-5 py-3 text-sm font-semibold text-[#c8102e] transition hover:bg-[#fff1f2]"
              >
                No-Show
              </button>
              <button
                type="button"
                onClick={() => setConfirmingAction("end")}
                className="inline-flex items-center justify-center rounded-full bg-[#071f41] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0f2942]"
              >
                End Help
              </button>
              {/* Revert: put the student back to WAITING if the TA started the wrong person */}
              <button
                type="button"
                onClick={onRevert}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Revert
              </button>
            </div>
          )}

          <p className="text-sm leading-6 text-slate-500">
            Help finished? Remind student to scan out at the door.
          </p>
        </div>
      ) : (
        <div className="px-6 py-10">
          <div className="rounded-[26px] border border-dashed border-slate-200 bg-[#f8fafc] px-6 py-8 text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
              <Dot className="h-10 w-10" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-[#071f41]">
              No student currently selected.
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Start a student from the waiting room below.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
