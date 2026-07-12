"use client";

import { useCallback, useMemo, useState } from "react";
import { CalendarPlus, PlusCircle } from "lucide-react";
import { Navbar } from "../Navbar";
import { AddOneTimeSessionModal } from "./AddOneTimeSessionModal";
import { CreateRecurringBlockModal } from "./CreateRecurringBlockModal";
import { EditRecurringBlockModal } from "./EditRecurringBlockModal";
import { TIME_SLOTS } from "./data";
import { EditSessionPanel } from "./EditSessionPanel";
import { RecurringBlocks } from "./RecurringBlocks";
import {
  cancelSessionAction,
  createOneTimeSessionAction,
  createRecurringBlockAction,
  deleteRecurringBlockAction,
  getSchedulePageAction,
  updateRecurringBlockAction,
  updateSessionAction,
} from "@/actions/scheduling";
import type { SchedulePageResponse } from "@/lib/scheduling/types";
import { WeeklyCalendar } from "./WeeklyCalendar";
import type {
  RecurringRule,
  ScheduleSession,
  ScheduleStaffMember,
} from "./types";
import type { CreateOneTimeSessionInput } from "@/lib/scheduling/types";
import type { CreateRecurringBlockInput } from "@/lib/scheduling/types";
import {
  formatDateOnlyLocal,
  startOfWeekMonday,
  type WeekdayKey,
} from "@/lib/scheduling/time";

type ActiveScheduleModal = "one-time" | "recurring" | null;

type InstructorScheduleDashboardProps = {
  initialData: SchedulePageResponse;
  offeringPublicId: string;
  courseLabel: string;
};

function pickInitialSessionId(
  sessions: SchedulePageResponse["sessions"],
): string | null {
  return sessions[0]?.id ?? null;
}

export default function InstructorScheduleDashboard({
  initialData,
  offeringPublicId: offeringPublicIdProp,
  courseLabel,
}: InstructorScheduleDashboardProps) {
  const [offeringPublicId, setOfferingPublicId] = useState<string | null>(
    initialData.offering?.offeringPublicId ?? offeringPublicIdProp ?? null,
  );
  const [termCode, setTermCode] = useState(
    initialData.offering?.termCode ?? "",
  );
  const [weekStart, setWeekStart] = useState<string | null>(
    initialData.weekStart,
  );
  const [weekLabel, setWeekLabel] = useState(initialData.weekLabel ?? "");
  const [calendarDays, setCalendarDays] = useState(initialData.calendarDays);
  const [sessions, setSessions] = useState<ScheduleSession[]>(
    initialData.sessions,
  );
  const [rules, setRules] = useState<RecurringRule[]>(initialData.rules);
  const [staff, setStaff] = useState<ScheduleStaffMember[]>(initialData.staff);
  const [canEdit, setCanEdit] = useState(initialData.canEdit);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    () => pickInitialSessionId(initialData.sessions),
  );
  const [activeModal, setActiveModal] = useState<ActiveScheduleModal>(null);
  const [editingRule, setEditingRule] = useState<RecurringRule | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadSchedule = useCallback(
    async (opts?: { offeringPublicId?: string; weekStart?: string }) => {
      setLoading(true);
      setError(null);
      try {
        const data = await getSchedulePageAction({
          offeringPublicId:
            opts?.offeringPublicId ?? offeringPublicId ?? undefined,
          weekStart: opts?.weekStart ?? weekStart ?? undefined,
        });

        if (data.offering) {
          setOfferingPublicId(data.offering.offeringPublicId);
          setTermCode(data.offering.termCode);
          setCanEdit(data.canEdit);
        }
        if (data.weekStart) {
          setWeekStart(data.weekStart);
        }
        setWeekLabel(data.weekLabel ?? "");
        setCalendarDays(data.calendarDays);
        setSessions(data.sessions);
        setRules(data.rules);
        setStaff(data.staff);

        setSelectedSessionId((current) => {
          if (current && data.sessions.some((s) => s.id === current)) {
            return current;
          }
          return data.sessions[0]?.id ?? null;
        });
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load schedule.",
        );
      } finally {
        setLoading(false);
      }
    },
    [offeringPublicId, weekStart],
  );

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedSessionId) ?? null,
    [sessions, selectedSessionId],
  );

  const shiftWeek = (direction: -1 | 1) => {
    if (!weekStart) return;
    const current = new Date(`${weekStart}T00:00:00`);
    current.setDate(current.getDate() + direction * 7);
    const next = current.toISOString().slice(0, 10);
    void loadSchedule({ weekStart: next });
  };

  const goToThisWeek = () => {
    const monday = formatDateOnlyLocal(startOfWeekMonday(new Date()));
    void loadSchedule({ weekStart: monday });
  };

  const handleCreateRecurring = async (input: {
    title: string;
    uiType: CreateRecurringBlockInput["uiType"];
    weekdayKeys: WeekdayKey[];
    startTime: string;
    endTime: string;
    validFrom: string;
    validUntil: string;
    location?: string;
    hostUserPublicIds?: string[];
  }) => {
    if (!offeringPublicId) return;
    setActionError(null);
    await createRecurringBlockAction({
      offeringPublicId,
      title: input.title,
      uiType: input.uiType,
      weekdayKeys: input.weekdayKeys,
      startTime: input.startTime,
      endTime: input.endTime,
      validFrom: input.validFrom,
      validUntil: input.validUntil,
      location: input.location,
      hostUserPublicIds: input.hostUserPublicIds,
    });
    setActiveModal(null);
    await loadSchedule();
  };

  const handleCreateOneTime = async (input: CreateOneTimeSessionInput) => {
    setActionError(null);
    await createOneTimeSessionAction(input);
    setActiveModal(null);
    await loadSchedule();
  };

  const handleSaveSession = async (patch: {
    title?: string;
    location?: string | null;
    date?: string;
    startTime?: string;
    endTime?: string;
    hostUserPublicIds?: string[];
  }) => {
    if (!selectedSession) return;
    setActionError(null);
    await updateSessionAction(selectedSession.id, patch);
    await loadSchedule();
  };

  const handleUpdateRecurringBlock = async (input: {
    title: string;
    location: string;
    startTime: string;
    endTime: string;
  }) => {
    if (!editingRule) return;
    setActionError(null);
    await updateRecurringBlockAction(editingRule.id, {
      title: input.title,
      location: input.location || null,
      startTime: input.startTime,
      endTime: input.endTime,
    });
    setEditingRule(null);
    await loadSchedule();
  };

  const handleDeleteRecurringBlock = async () => {
    if (!editingRule) return;
    setActionError(null);
    await deleteRecurringBlockAction(editingRule.id);
    setEditingRule(null);
    await loadSchedule();
  };

  const handleCancelSession = async () => {
    if (!selectedSession) return;
    setActionError(null);
    await cancelSessionAction(selectedSession.id);
    await loadSchedule();
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <Navbar
          activeItem="schedule"
          showSearch
          offeringPublicId={offeringPublicIdProp}
        />

        <main className="mt-10 space-y-8">
          <section className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-[#071f41] sm:text-[2.1rem]">
                Master Schedule
              </h1>
              <p className="text-base text-slate-600">
                Configure recurring office hours and manage live session
                overrides.
                {!canEdit && offeringPublicId ? (
                  <span className="mt-1 block text-sm font-medium text-[#c8102e]">
                    View only — instructors can edit this schedule.
                  </span>
                ) : null}
              </p>
            </div>

            {canEdit ? (
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setActiveModal("one-time")}
                  disabled={!offeringPublicId}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-[#071f41] shadow-[0_14px_30px_-20px_rgba(7,31,65,0.35)] transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                >
                  <CalendarPlus className="h-4 w-4" />
                  Add One-time Session
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal("recurring")}
                  disabled={!offeringPublicId}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#071f41] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(7,31,65,0.7)] transition hover:bg-[#0f2942] disabled:opacity-50"
                >
                  <PlusCircle className="h-4 w-4" />
                  Create Recurring Block
                </button>
              </div>
            ) : null}
          </section>

          {error ? (
            <p className="rounded-2xl border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm text-[#991b1b]">
              {error}
            </p>
          ) : null}
          {actionError ? (
            <p className="rounded-2xl border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm text-[#991b1b]">
              {actionError}
            </p>
          ) : null}

          {loading && sessions.length === 0 ? (
            <p className="text-sm text-slate-500">Loading schedule…</p>
          ) : !offeringPublicId ? (
            <p className="text-sm text-slate-500">
              No schedule found. Add yourself as an instructor or TA to view the
              schedule.
            </p>
          ) : (
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_360px]">
              <WeeklyCalendar
                days={
                  calendarDays.length > 0
                    ? calendarDays
                    : [
                        { key: "mon", label: "MON", date: "—" },
                        { key: "tue", label: "TUE", date: "—" },
                        { key: "wed", label: "WED", date: "—" },
                        { key: "thu", label: "THU", date: "—" },
                        { key: "fri", label: "FRI", date: "—" },
                      ]
                }
                timeSlots={TIME_SLOTS}
                sessions={sessions}
                selectedSessionId={selectedSession?.id ?? ""}
                onSelectSession={setSelectedSessionId}
                weekLabel={weekLabel}
                weekStart={weekStart}
                onPreviousWeek={() => shiftWeek(-1)}
                onNextWeek={() => shiftWeek(1)}
                onGoToThisWeek={goToThisWeek}
                canEdit={canEdit}
                onCreateRecurring={() => setActiveModal("recurring")}
                onCreateOneTime={() => setActiveModal("one-time")}
              />

              <div className="space-y-6">
                {selectedSession ? (
                  <EditSessionPanel
                    key={selectedSession.id}
                    selectedSession={selectedSession}
                    staff={staff}
                    canEdit={canEdit}
                    onSave={handleSaveSession}
                    onCancelSession={handleCancelSession}
                    onError={setActionError}
                  />
                ) : (
                  <p className="rounded-[30px] border border-slate-200/80 bg-white p-6 text-sm text-slate-500">
                    {sessions.length === 0
                      ? "Create a recurring block or add a one-time session to populate the calendar, then select a session here to view or edit it."
                      : "Select a session on the calendar to view details."}
                  </p>
                )}
              </div>
            </section>
          )}

          <RecurringBlocks
            blocks={rules}
            canEdit={canEdit}
            onEditBlock={setEditingRule}
            onCreateBlock={() => setActiveModal("recurring")}
          />
        </main>
      </div>

      {offeringPublicId ? (
        <>
          <AddOneTimeSessionModal
            isOpen={activeModal === "one-time"}
            onClose={() => setActiveModal(null)}
            offeringPublicId={offeringPublicId}
            staff={staff}
            onSubmit={handleCreateOneTime}
            onError={setActionError}
          />
          <CreateRecurringBlockModal
            isOpen={activeModal === "recurring"}
            onClose={() => setActiveModal(null)}
            termCode={termCode}
            staff={staff}
            onSubmit={handleCreateRecurring}
            onError={setActionError}
          />
          <EditRecurringBlockModal
            isOpen={editingRule !== null}
            block={editingRule}
            onClose={() => setEditingRule(null)}
            onSave={handleUpdateRecurringBlock}
            onDelete={handleDeleteRecurringBlock}
            onError={setActionError}
          />
        </>
      ) : null}
    </div>
  );
}
