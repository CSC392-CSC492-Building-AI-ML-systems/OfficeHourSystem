"use client";

import { useEffect, useRef, useState } from "react";
import { ActivitySquare, RefreshCw, ScanLine } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "../Navbar";
import { CurrentlyHelpingCard } from "./CurrentlyHelpingCard";
import type { QueueStudent } from "./types";
import { WaitingRoom } from "./WaitingRoom";
import { getActiveQueueAction } from "@/actions/get_active_queue/get-active-queue";
import { startHelpingAction } from "@/actions/start_helping/start-helping";
import { revertToWaitingAction } from "@/actions/revert_to_waiting/revert-to-waiting";
import { updateAttendanceStatusAction } from "@/actions/update_attendance_status/update-attendance-status";
import { endSessionAction } from "@/actions/end_session/end-session";

// Compute initials from a full name e.g. "Alice Chen" → "AC"
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// One helping student with their own elapsed timer (seconds since help started)
type HelpingEntry = {
  student: QueueStudent;
  seconds: number;
};

export default function ActiveQueuePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  // Confirmation state for entering scan mode (kiosk lock means no easy back)
  const [scanState, setScanState] = useState<"idle" | "confirming">("idle");

  const [waitingStudents, setWaitingStudents] = useState<QueueStudent[]>([]);

  // Multiple students can be helped at the same time
  const [helpingStudents, setHelpingStudents] = useState<HelpingEntry[]>([]);

  const [loading, setLoading] = useState(true);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [endsAt, setEndsAt] = useState<string | null>(null);

  // Real session meta from the server (was previously hardcoded dummy data)
  const [subtitle, setSubtitle] = useState("");
  const [lastScanName, setLastScanName] = useState<string | null>(null);

  // "idle" | "confirming" | "loading"
  const [endSessionState, setEndSessionState] = useState<
    "idle" | "confirming" | "loading"
  >("idle");

  // Track which student IDs are currently being started to prevent double-click race
  const startingRef = useRef<Set<string>>(new Set());

  // Load queue data from the server when the page opens
  useEffect(() => {
    if (!sessionId) return;

    void (async () => {
      setLoading(true);
      try {
        const data = await getActiveQueueAction(sessionId);

        setEndsAt(data.endsAt);
        setSubtitle(`${data.courseCode}: ${data.title}`);
        setLastScanName(data.lastCheckInName);
        if (data.sessionStatus === "COMPLETED") {
          setSessionEnded(true);
        }

        setWaitingStudents(
          data.waiting.map((s) => ({
            id: s.attendancePublicId,
            name: s.studentName,
            username: s.studentPublicId,
            initials: getInitials(s.studentName),
          })),
        );

        // Load all IN_HELP students from the server
        setHelpingStudents(
          data.helping.map((h) => ({
            student: {
              id: h.attendancePublicId,
              name: h.studentName,
              username: h.studentPublicId,
              initials: getInitials(h.studentName),
            },
            seconds: 0,
          })),
        );
      } catch (e) {
        console.error("Failed to load queue:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId]);

  // One shared interval — ticks every second and increments each helping student's timer
  useEffect(() => {
    if (helpingStudents.length === 0) return;

    const timer = window.setInterval(() => {
      setHelpingStudents((current) =>
        current.map((entry) => ({ ...entry, seconds: entry.seconds + 1 })),
      );
    }, 1000);

    return () => window.clearInterval(timer);
  }, [helpingStudents.length]);

  // Auto-end: if 30 minutes past the scheduled endsAt, fire endSessionAction automatically
  useEffect(() => {
    if (!sessionId || !endsAt || sessionEnded) return;

    const AUTO_END_GRACE_MS = 30 * 60 * 1000; // 30 minutes

    const check = setInterval(() => {
      const overdue = Date.now() - new Date(endsAt).getTime();
      if (overdue >= AUTO_END_GRACE_MS) {
        clearInterval(check);
        void endSessionAction(sessionId).then(() => {
          setSessionEnded(true);
          setWaitingStudents([]);
          setHelpingStudents([]);
        });
      }
    }, 15 * 60_000); // check every 15 minutes

    return () => clearInterval(check);
  }, [sessionId, endsAt, sessionEnded]);

  // Reload queue state from the server and sync local state
  const refreshQueue = async () => {
    if (!sessionId) return;
    const data = await getActiveQueueAction(sessionId);

    setLastScanName(data.lastCheckInName);

    setWaitingStudents(
      data.waiting.map((s) => ({
        id: s.attendancePublicId,
        name: s.studentName,
        username: s.studentPublicId,
        initials: getInitials(s.studentName),
      })),
    );

    setHelpingStudents((current) =>
      data.helping.map((h) => {
        // Preserve the elapsed timer for students already in the helping list
        const existing = current.find(
          (e) => e.student.id === h.attendancePublicId,
        );
        return {
          student: {
            id: h.attendancePublicId,
            name: h.studentName,
            username: h.studentPublicId,
            initials: getInitials(h.studentName),
          },
          seconds: existing?.seconds ?? 0,
        };
      }),
    );
  };

  const handleStartStudent = (student: QueueStudent) => {
    // Prevent double-click: block if this student is already being started
    if (startingRef.current.has(student.id)) return;
    startingRef.current.add(student.id);

    void (async () => {
      try {
        if (!sessionId) return;
        const result = await startHelpingAction(sessionId, student.id);
        if (result.outcome === "started") {
          // Refresh from server so queue reflects the real DB state
          await refreshQueue();
        }
      } finally {
        startingRef.current.delete(student.id);
      }
    })();
  };

  const handleResolveStudent = (
    student: QueueStudent,
    action: "end" | "no_show",
  ) => {
    void (async () => {
      if (!sessionId) return;
      const result = await updateAttendanceStatusAction(
        sessionId,
        student.id,
        action,
      );
      if (result.outcome === "updated") {
        startingRef.current.delete(student.id);
        await refreshQueue();
      }
    })();
  };

  const handleEndSession = () => {
    void (async () => {
      if (!sessionId) return;
      setEndSessionState("loading");
      try {
        await endSessionAction(sessionId);
        setSessionEnded(true);
        setWaitingStudents([]);
        setHelpingStudents([]);
      } finally {
        setEndSessionState("idle");
      }
    })();
  };

  const handleRevertStudent = (student: QueueStudent) => {
    void (async () => {
      if (!sessionId) return;
      const result = await revertToWaitingAction(sessionId, student.id);
      if (result.outcome === "reverted") {
        await refreshQueue();
      }
    })();
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <Navbar activeItem="queues" />

        <main className="mt-10 space-y-8">
          {loading ? (
            <p className="text-sm text-slate-500">Loading queue…</p>
          ) : null}

          <section className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-[#071f41] sm:text-[2.1rem]">
                My Queue
              </h1>
              <p className="text-base text-slate-600">{subtitle}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d7e7ff] bg-[#eef5ff] px-4 py-2 text-sm font-medium text-[#071f41]">
                <RefreshCw className="h-4 w-4" />
                Last scan: {lastScanName ?? "No check-ins yet"}
              </span>

              {/* Scan mode entry — hidden once the session has ended */}
              {!sessionEnded &&
                (scanState === "confirming" ? (
                  <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-sm font-medium text-amber-800">
                      Open scanner? You will not be able to navigate away.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          router.replace(
                            `/instructor/scan?sessionId=${sessionId}`,
                          )
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
                    className="inline-flex items-center gap-2 rounded-full border border-[#071f41] px-5 py-2 text-sm font-semibold text-[#071f41] transition hover:bg-[#eef5ff]"
                  >
                    <ScanLine className="h-4 w-4" />
                    Start Scanning
                  </button>
                ))}

              {sessionEnded ? (
                <span className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-500">
                  Session Ended
                </span>
              ) : endSessionState === "confirming" ? (
                /* Confirmation prompt — warns TA about students still in progress */
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-sm font-medium text-amber-800">
                    End session? Any students still being helped will be marked
                    complete.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleEndSession}
                      className="inline-flex items-center justify-center rounded-full bg-[#c8102e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#a00d25]"
                    >
                      Confirm End
                    </button>
                    <button
                      type="button"
                      onClick={() => setEndSessionState("idle")}
                      className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={endSessionState === "loading"}
                  onClick={() => setEndSessionState("confirming")}
                  className="inline-flex items-center justify-center rounded-full border border-[#c8102e] px-5 py-2 text-sm font-semibold text-[#c8102e] transition hover:bg-[#fff1f2] disabled:opacity-50"
                >
                  {endSessionState === "loading" ? "Ending…" : "End Session"}
                </button>
              )}
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              The Active Workspace
            </p>
          </section>

          {/* Render one card per student being helped */}
          {helpingStudents.length === 0 ? (
            <CurrentlyHelpingCard
              currentlyHelping={null}
              sessionSeconds={0}
              onNoShow={() => undefined}
              onEndHelp={() => undefined}
              onRevert={() => undefined}
            />
          ) : (
            helpingStudents.map((entry) => (
              <CurrentlyHelpingCard
                key={entry.student.id}
                currentlyHelping={entry.student}
                sessionSeconds={entry.seconds}
                onNoShow={() => handleResolveStudent(entry.student, "no_show")}
                onEndHelp={() => handleResolveStudent(entry.student, "end")}
                onRevert={() => handleRevertStudent(entry.student)}
              />
            ))
          )}

          <section className="rounded-[30px] border border-[#d7e7ff] bg-[#eef5ff] px-6 py-5 shadow-[0_18px_50px_-30px_rgba(15,41,66,0.25)]">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#071f41] shadow-sm">
                <ActivitySquare className="h-5 w-5" />
              </span>
              <p className="max-w-3xl text-sm leading-6 text-slate-600">
                Multiple students can be helped at the same time. Start a
                student from the waiting room below.
              </p>
            </div>
          </section>

          {/* START buttons are always enabled — no single-student restriction */}
          <WaitingRoom
            waitingStudents={waitingStudents}
            hasActiveStudent={false}
            onStartStudent={handleStartStudent}
          />
        </main>
      </div>
    </div>
  );
}
