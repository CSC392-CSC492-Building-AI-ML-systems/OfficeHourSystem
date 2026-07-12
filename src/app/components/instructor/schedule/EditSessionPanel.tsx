"use client";

import { useState } from "react";
import { CalendarClock } from "lucide-react";
import { FieldCharLimitHint } from "./FieldCharLimitHint";
import { OfficeHourHostSelect } from "./OfficeHourHostSelect";
import { OfficeHourTimeFields } from "./OfficeHourTimeFields";
import {
  clampToMaxLength,
  LOCATION_MAX_LENGTH,
  SESSION_TOPIC_MAX_LENGTH,
} from "./scheduleFieldLimits";
import type { ScheduleSession, ScheduleStaffMember } from "./types";
import { validateOfficeHourTimes } from "@/lib/scheduling/time";

interface EditSessionPanelProps {
  selectedSession: ScheduleSession;
  staff: ScheduleStaffMember[];
  canEdit: boolean;
  onSave: (patch: {
    title?: string;
    location?: string | null;
    date?: string;
    startTime?: string;
    endTime?: string;
    hostUserPublicIds?: string[];
  }) => Promise<void>;
  onCancelSession: () => Promise<void>;
  onError?: (message: string | null) => void;
}

export function EditSessionPanel({
  selectedSession,
  staff,
  canEdit,
  onSave,
  onCancelSession,
  onError,
}: EditSessionPanelProps) {
  const [topic, setTopic] = useState(() =>
    clampToMaxLength(selectedSession.topic, SESSION_TOPIC_MAX_LENGTH),
  );
  const [location, setLocation] = useState(() =>
    clampToMaxLength(selectedSession.location, LOCATION_MAX_LENGTH),
  );
  const [date, setDate] = useState(selectedSession.date);
  const [startTime, setStartTime] = useState(selectedSession.startTimeInput);
  const [endTime, setEndTime] = useState(selectedSession.endTimeInput);
  const [hostPublicIds, setHostPublicIds] = useState(
    () => selectedSession.hostPublicIds,
  );
  const [savedMessage, setSavedMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSaveOverride = async () => {
    if (!canEdit) return;
    onError?.(null);

    const timeError = validateOfficeHourTimes(startTime, endTime);
    if (timeError) {
      onError?.(timeError);
      return;
    }

    setSubmitting(true);
    try {
      await onSave({
        title: topic.trim() || selectedSession.title,
        location: location.trim() || null,
        startTime,
        endTime,
        ...(selectedSession.isRecurringOccurrence ? {} : { date }),
        hostUserPublicIds: hostPublicIds,
      });
      setSavedMessage("Session override saved.");
    } catch (saveError) {
      onError?.(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save session.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!canEdit) return;
    onError?.(null);
    setSubmitting(true);
    try {
      await onCancelSession();
      setSavedMessage("Session cancelled.");
    } catch (cancelError) {
      onError?.(
        cancelError instanceof Error
          ? cancelError.message
          : "Failed to cancel session.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_50px_-30px_rgba(15,41,66,0.35)]">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#071f41]">
          <CalendarClock className="h-5 w-5" />
        </span>
        <h2 className="text-xl font-semibold text-[#071f41]">Edit Session</h2>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-[#f8fafc] p-4">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500">
          SELECTED SESSION
        </p>
        <h3 className="mt-2 text-lg font-semibold text-[#071f41]">
          {selectedSession.sessionTypeLabel}
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          {selectedSession.dateLabel}, {selectedSession.startTime} -{" "}
          {selectedSession.endTime}
        </p>
        {selectedSession.hostLabel !== "Unassigned" ? (
          <p className="mt-1 text-sm text-slate-600">
            Hosts: {selectedSession.hostLabel}
          </p>
        ) : null}
      </div>

      <div className="mt-6 space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-[#071f41]">
            Session Topic
          </label>
          {canEdit ? (
            <>
              <input
                type="text"
                value={topic}
                maxLength={SESSION_TOPIC_MAX_LENGTH}
                onChange={(event) => setTopic(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#071f41]"
              />
              <FieldCharLimitHint maxLength={SESSION_TOPIC_MAX_LENGTH} />
            </>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
              {selectedSession.topic}
            </div>
          )}
        </div>

        {!selectedSession.isRecurringOccurrence && canEdit ? (
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#071f41]">
              Date
            </span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#071f41]"
            />
          </label>
        ) : null}

        {canEdit ? (
          <OfficeHourTimeFields
            startTime={startTime}
            endTime={endTime}
            onStartTimeChange={setStartTime}
            onEndTimeChange={setEndTime}
          />
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            {selectedSession.startTime} - {selectedSession.endTime}
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-[#071f41]">
            Location
          </label>
          {canEdit ? (
            <>
              <input
                type="text"
                value={location}
                maxLength={LOCATION_MAX_LENGTH}
                onChange={(event) => setLocation(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#071f41]"
              />
              <FieldCharLimitHint maxLength={LOCATION_MAX_LENGTH} />
            </>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
              {selectedSession.location}
            </div>
          )}
        </div>

        <div>
          {canEdit ? (
            <OfficeHourHostSelect
              id="edit-session-hosts"
              staff={staff}
              value={hostPublicIds}
              onChange={setHostPublicIds}
              hint="Select one or more hosts for this session."
            />
          ) : (
            <>
              <label className="mb-2 block text-sm font-medium text-[#071f41]">
                Session Hosts
              </label>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                {selectedSession.hostLabel}
              </div>
            </>
          )}
        </div>
      </div>

      <p className="mt-6 text-xs italic leading-5 text-slate-500">
        {selectedSession.isRecurringOccurrence
          ? `Updating this only affects the ${selectedSession.dateLabel} session.`
          : "Updating this only affects this one-time session."}
      </p>

      {canEdit ? (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => void handleSaveOverride()}
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-full bg-[#071f41] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0f2942] disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save Override"}
          </button>
          <button
            type="button"
            onClick={() => void handleCancel()}
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-full border border-[#c8102e] px-5 py-3 text-sm font-semibold text-[#c8102e] transition hover:bg-[#fff1f2] disabled:opacity-50"
          >
            Cancel Session
          </button>
        </div>
      ) : null}
      {savedMessage ? (
        <p className="mt-3 text-sm text-slate-500">{savedMessage}</p>
      ) : null}
    </section>
  );
}
