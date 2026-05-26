"use client";

import { useMemo, useState } from "react";
import { CalendarPlus, PlusCircle } from "lucide-react";
import { Navbar } from "../Navbar";
import { AddOneTimeSessionModal } from "./AddOneTimeSessionModal";
import { CreateRecurringBlockModal } from "./CreateRecurringBlockModal";
import {
  CALENDAR_DAYS,
  DEFAULT_SELECTED_SESSION_ID,
  DUMMY_ON_DUTY_TAS,
  DUMMY_RECURRING_RULES,
  DUMMY_SCHEDULE_SESSIONS,
  TIME_SLOTS,
} from "./data";
import { EditSessionPanel } from "./EditSessionPanel";
import { OnDutyTAsCard } from "./OnDutyTAsCard";
import { RecurringBlocks } from "./RecurringBlocks";
import { WeeklyCalendar } from "./WeeklyCalendar";

type ActiveScheduleModal = "one-time" | "recurring" | null;

export default function InstructorScheduleDashboard() {
  const [selectedSessionId, setSelectedSessionId] = useState(
    DEFAULT_SELECTED_SESSION_ID,
  );
  const [activeModal, setActiveModal] = useState<ActiveScheduleModal>(null);

  const selectedSession = useMemo(
    () =>
      DUMMY_SCHEDULE_SESSIONS.find(
        (session) => session.id === selectedSessionId,
      ) ?? DUMMY_SCHEDULE_SESSIONS[0],
    [selectedSessionId],
  );

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <Navbar activeItem="schedule" showSearch />

        <main className="mt-10 space-y-8">
          <section className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-[#071f41] sm:text-[2.1rem]">
                Master Schedule
              </h1>
              <p className="text-base text-slate-600">
                Configure recurring office hours and manage live session
                overrides.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setActiveModal("one-time")}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-[#071f41] shadow-[0_14px_30px_-20px_rgba(7,31,65,0.35)] transition hover:border-slate-300 hover:bg-slate-50"
              >
                <CalendarPlus className="h-4 w-4" />
                Add One-time Session
              </button>
              <button
                type="button"
                onClick={() => setActiveModal("recurring")}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#071f41] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(7,31,65,0.7)] transition hover:bg-[#0f2942]"
              >
                <PlusCircle className="h-4 w-4" />
                Create Recurring Block
              </button>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_360px]">
            <WeeklyCalendar
              days={CALENDAR_DAYS}
              timeSlots={TIME_SLOTS}
              sessions={DUMMY_SCHEDULE_SESSIONS}
              selectedSessionId={selectedSession.id}
              onSelectSession={setSelectedSessionId}
            />

            <div className="space-y-6">
              <EditSessionPanel
                key={selectedSession.id}
                selectedSession={selectedSession}
              />
              <OnDutyTAsCard tas={DUMMY_ON_DUTY_TAS} />
            </div>
          </section>

          <RecurringBlocks blocks={DUMMY_RECURRING_RULES} />
        </main>
      </div>

      <AddOneTimeSessionModal
        isOpen={activeModal === "one-time"}
        onClose={() => setActiveModal(null)}
      />
      <CreateRecurringBlockModal
        isOpen={activeModal === "recurring"}
        onClose={() => setActiveModal(null)}
      />
    </div>
  );
}
