"use client";

import { useEffect, useMemo, useState } from "react";
import { ActivitySquare, RefreshCw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "../Navbar";
import { CurrentlyHelpingCard } from "./CurrentlyHelpingCard";
import { DUMMY_QUEUE_SESSIONS, DUMMY_WAITING_STUDENTS } from "./data";
import type { QueueStudent } from "./types";
import { WaitingRoom } from "./WaitingRoom";

const INITIAL_SESSION_SECONDS = 14 * 60 + 20;

export default function ActiveQueuePage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const [waitingStudents, setWaitingStudents] = useState(
    DUMMY_WAITING_STUDENTS,
  );
  const [currentlyHelping, setCurrentlyHelping] = useState<QueueStudent | null>(
    null,
  );
  const [sessionSeconds, setSessionSeconds] = useState(INITIAL_SESSION_SECONDS);

  const activeSession = useMemo(
    () =>
      DUMMY_QUEUE_SESSIONS.find((session) => session.id === sessionId) ??
      DUMMY_QUEUE_SESSIONS[0],
    [sessionId],
  );

  useEffect(() => {
    if (!currentlyHelping) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setSessionSeconds((currentSeconds) => currentSeconds + 1);
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [currentlyHelping]);

  const handleStartStudent = (student: QueueStudent) => {
    if (currentlyHelping) {
      return;
    }

    setCurrentlyHelping(student);
    setWaitingStudents((currentStudents) =>
      currentStudents.filter(
        (currentStudent) => currentStudent.id !== student.id,
      ),
    );
    setSessionSeconds(INITIAL_SESSION_SECONDS);
  };

  const clearCurrentStudent = () => {
    setCurrentlyHelping(null);
    setSessionSeconds(INITIAL_SESSION_SECONDS);
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <Navbar activeItem="queues" />

        <main className="mt-10 space-y-8">
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

          <CurrentlyHelpingCard
            currentlyHelping={currentlyHelping}
            sessionSeconds={sessionSeconds}
            onNoShow={clearCurrentStudent}
            onEndHelp={clearCurrentStudent}
          />

          <section className="rounded-[30px] border border-[#d7e7ff] bg-[#eef5ff] px-6 py-5 shadow-[0_18px_50px_-30px_rgba(15,41,66,0.25)]">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#071f41] shadow-sm">
                <ActivitySquare className="h-5 w-5" />
              </span>
              <p className="max-w-3xl text-sm leading-6 text-slate-600">
                Students remain in the waiting room until you explicitly start
                them. While one student is active, all other start actions stay
                disabled so the workspace matches your live help session.
              </p>
            </div>
          </section>

          <WaitingRoom
            waitingStudents={waitingStudents}
            hasActiveStudent={currentlyHelping !== null}
            onStartStudent={handleStartStudent}
          />
        </main>
      </div>
    </div>
  );
}
