"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock3, MapPin } from "lucide-react";
import { startSessionAction } from "@/actions/start_session/start-session";
import type { QueueSession } from "./types";

interface QueueSessionCardProps {
  session: QueueSession;
}

export function QueueSessionCard({ session }: QueueSessionCardProps) {
  const router = useRouter();

  // State for START SESSION confirmation
  const [state, setState] = useState<"idle" | "confirming" | "loading">("idle");

  // State for START SCANNING confirmation (separate from start session)
  const [scanState, setScanState] = useState<"idle" | "confirming">("idle");

  const handleStartClick = () => setState("confirming");

  const handleConfirm = async () => {
    setState("loading");
    try {
      const result = await startSessionAction(session.id);
      if (result.outcome === "started" || result.outcome === "already_active") {
        // Use replace so the browser back button doesn't return here mid-session
        router.replace(`/instructor/my-queues/active?sessionId=${session.id}`);
      }
    } catch {
      setState("idle");
    }
  };

  const handleCancel = () => setState("idle");

  return (
    <article
      className={`rounded-[30px] border bg-white p-6 shadow-[0_18px_50px_-30px_rgba(15,41,66,0.35)] ${
        session.isHighlighted
          ? "border-slate-200/80 border-l-4 border-l-[#c8102e]"
          : "border-slate-200/80"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {session.courseLabel}
      </p>
      <h3 className="mt-4 text-2xl font-semibold text-[#071f41]">
        {session.title}
      </h3>

      <div className="mt-5 space-y-3 text-sm text-slate-600">
        <p className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-slate-400" />
          <span>{session.time}</span>
        </p>
        <p className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-slate-400" />
          <span>{session.location}</span>
        </p>
      </div>

      <div className="mt-6">
        {/* ENDED: no action available */}
        {session.status === "COMPLETED" ? (
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-medium text-slate-400">
            Session Ended
          </span>

        ) : session.status === "ACTIVE" ? (
          /* ACTIVE: two buttons — check queue or open scanner */
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.push(`/instructor/my-queues/active?sessionId=${session.id}`)}
              className="inline-flex items-center gap-2 rounded-full bg-[#22c55e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#16a34a]"
            >
              Check Session Queue →
            </button>

            {scanState === "confirming" ? (
              /* Confirmation before entering scan mode */
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm font-medium text-amber-800">
                  Open scanner? You will not be able to navigate away.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      router.replace(`/instructor/scan?sessionId=${session.id}`)
                    }
                    className="inline-flex items-center justify-center rounded-full bg-[#071f41] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0f2942]"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setScanState("idle")}
                    className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setScanState("confirming")}
                className="inline-flex items-center gap-2 rounded-full border border-[#071f41] px-5 py-3 text-sm font-semibold text-[#071f41] transition hover:bg-[#eef5ff]"
              >
                Start Scanning
              </button>
            )}
          </div>

        ) : state === "confirming" ? (
          /* UPCOMING confirming: show confirmation prompt */
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-medium text-amber-800">
              Start this session and open the queue?
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
          /* UPCOMING idle: start session button */
          <button
            type="button"
            disabled={state === "loading"}
            onClick={handleStartClick}
            className="inline-flex items-center gap-2 rounded-full bg-[#071f41] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0f2942] disabled:opacity-50"
          >
            {state === "loading" ? "Starting…" : "Start Session ▶"}
          </button>
        )}
      </div>
    </article>
  );
}
