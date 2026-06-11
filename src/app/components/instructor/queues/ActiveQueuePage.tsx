"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ActivitySquare, RefreshCw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "../Navbar";
import { CurrentlyHelpingCard } from "./CurrentlyHelpingCard";
import { DUMMY_QUEUE_SESSIONS } from "./data";
import type { QueueStudent } from "./types";
import { WaitingRoom } from "./WaitingRoom";
import { getActiveQueueAction } from "@/actions/get_active_queue/get-active-queue";

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
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const [waitingStudents, setWaitingStudents] = useState<QueueStudent[]>([]);

  // Multiple students can be helped at the same time
  const [helpingStudents, setHelpingStudents] = useState<HelpingEntry[]>([]);

  const [loading, setLoading] = useState(true);

  // Track which student IDs are currently being started to prevent double-click race
  const startingRef = useRef<Set<string>>(new Set());

  const activeSession = useMemo(
    () =>
      DUMMY_QUEUE_SESSIONS.find((session) => session.id === sessionId) ??
      DUMMY_QUEUE_SESSIONS[0],
    [sessionId],
  );

  // Load queue data from the server when the page opens
  useEffect(() => {
    if (!sessionId) return;

    void (async () => {
      setLoading(true);
      try {
        const data = await getActiveQueueAction(sessionId);

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

  const handleStartStudent = (student: QueueStudent) => {
    // Prevent double-click: block if this student is already being started
    if (startingRef.current.has(student.id)) {
      return;
    }
    startingRef.current.add(student.id);

    // Move student from waiting list to helping list
    setHelpingStudents((current) => [
      ...current,
      { student, seconds: 0 },
    ]);
    setWaitingStudents((current) =>
      current.filter((s) => s.id !== student.id),
    );
  };

  const handleClearStudent = (studentId: string) => {
    startingRef.current.delete(studentId);
    setHelpingStudents((current) =>
      current.filter((entry) => entry.student.id !== studentId),
    );
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
              <p className="text-base text-slate-600">
                {activeSession.workspaceSubtitle}
              </p>
            </div>

            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d7e7ff] bg-[#eef5ff] px-4 py-2 text-sm font-medium text-[#071f41]">
              <RefreshCw className="h-4 w-4" />
              Last scan: {activeSession.lastScanLabel}
            </span>
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
            />
          ) : (
            helpingStudents.map((entry) => (
              <CurrentlyHelpingCard
                key={entry.student.id}
                currentlyHelping={entry.student}
                sessionSeconds={entry.seconds}
                onNoShow={() => handleClearStudent(entry.student.id)}
                onEndHelp={() => handleClearStudent(entry.student.id)}
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
