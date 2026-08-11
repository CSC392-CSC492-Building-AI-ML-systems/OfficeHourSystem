"use client";

import { useState } from "react";
import {
  Bug,
  CalendarRange,
  Check,
  ClipboardPenLine,
  Users,
  X,
} from "lucide-react";
import type { CreateRecurringBlockInput } from "@/lib/scheduling/types";
import {
  formatDateOnlyLocal,
  getTermBounds,
  validateOfficeHourTimes,
  type WeekdayKey,
} from "@/lib/scheduling/time";
import { FieldCharLimitHint } from "./FieldCharLimitHint";
import { OfficeHourHostSelect } from "./OfficeHourHostSelect";
import { OfficeHourTimeFields } from "./OfficeHourTimeFields";
import {
  BLOCK_NAME_MAX_LENGTH,
  LOCATION_MAX_LENGTH,
} from "./scheduleFieldLimits";
import { useModalOverlay } from "./useModalOverlay";
import type { ScheduleStaffMember } from "./types";

type SessionType = "drop-in" | "debugging-queue" | "topic-group";
type ScheduleDay = "mon" | "tue" | "wed" | "thu" | "fri";

interface CreateRecurringBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  termCode: string;
  staff: ScheduleStaffMember[];
  onSubmit: (input: {
    title: string;
    uiType: CreateRecurringBlockInput["uiType"];
    weekdayKeys: WeekdayKey[];
    startTime: string;
    endTime: string;
    validFrom: string;
    validUntil: string;
    location?: string;
    hostUserPublicIds?: string[];
  }) => Promise<void>;
  onError?: (message: string | null) => void;
}

const sessionTypeOptions: Array<{
  id: SessionType;
  label: string;
  description: string;
  icon: typeof CalendarRange;
}> = [
  {
    id: "drop-in",
    label: "Drop-in",
    description: "Open office hours for quick questions and concept checks.",
    icon: CalendarRange,
  },
  {
    id: "debugging-queue",
    label: "Help Centre",
    description: "One-on-one support for deeper assignment and code blockers.",
    icon: Bug,
  },
  {
    id: "topic-group",
    label: "Topic Group",
    description: "Small-group sessions focused on a specific topic or review.",
    icon: Users,
  },
];

const weekdayOptions: Array<{ id: ScheduleDay; label: string }> = [
  { id: "mon", label: "M" },
  { id: "tue", label: "T" },
  { id: "wed", label: "W" },
  { id: "thu", label: "T" },
  { id: "fri", label: "F" },
];

export function CreateRecurringBlockModal({
  isOpen,
  onClose,
  termCode,
  staff,
  onSubmit,
  onError,
}: CreateRecurringBlockModalProps) {
  useModalOverlay(isOpen, onClose);

  if (!isOpen) {
    return null;
  }

  return (
    <CreateRecurringBlockForm
      key={termCode}
      termCode={termCode}
      staff={staff}
      onClose={onClose}
      onSubmit={onSubmit}
      onError={onError}
    />
  );
}

function CreateRecurringBlockForm({
  termCode,
  staff,
  onClose,
  onSubmit,
  onError,
}: Omit<CreateRecurringBlockModalProps, "isOpen">) {
  const termBounds = getTermBounds(termCode);
  const [submitting, setSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<SessionType>("drop-in");
  const [selectedDays, setSelectedDays] = useState<ScheduleDay[]>([
    "mon",
    "wed",
    "fri",
  ]);
  const [validFromDate, setValidFromDate] = useState(() =>
    formatDateOnlyLocal(termBounds.validFrom),
  );
  const [validUntilDate, setValidUntilDate] = useState(() =>
    formatDateOnlyLocal(termBounds.validUntil),
  );
  const [startTime, setStartTime] = useState("14:00");
  const [endTime, setEndTime] = useState("16:00");
  const [locationDetail, setLocationDetail] = useState("Room 402");
  const [blockName, setBlockName] = useState("");
  const [hostPublicIds, setHostPublicIds] = useState<string[]>([]);

  const toggleDay = (day: ScheduleDay) => {
    setSelectedDays((currentDays) =>
      currentDays.includes(day)
        ? currentDays.filter((currentDay) => currentDay !== day)
        : [...currentDays, day],
    );
  };

  const handleClose = () => {
    onClose();
  };

  const showError = (message: string) => {
    onError?.(message);
    onClose();
  };

  const handleCreate = async () => {
    onError?.(null);

    if (!validFromDate || !validUntilDate) {
      showError("Start and end dates are required.");
      return;
    }

    if (validFromDate > validUntilDate) {
      showError("End date must be on or after start date.");
      return;
    }

    const timeError = validateOfficeHourTimes(startTime, endTime);
    if (timeError) {
      showError(timeError);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        title: blockName.trim() || "Office Hours",
        uiType: selectedType,
        weekdayKeys: selectedDays as WeekdayKey[],
        startTime,
        endTime,
        validFrom: validFromDate,
        validUntil: validUntilDate,
        location: locationDetail.trim() || undefined,
        hostUserPublicIds: hostPublicIds,
      });
    } catch (submitError) {
      showError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to create recurring block.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#071f41]/55 px-4 py-8 backdrop-blur-[2px]"
      onClick={handleClose}
    >
      <div
        className="max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-[32px] border border-slate-200/80 bg-white shadow-[0_40px_120px_-50px_rgba(7,31,65,0.7)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-6 border-b border-slate-200 px-6 py-5 sm:px-8">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#c8102e]">
              Schedule Builder
            </p>
            <div>
              <h2 className="text-2xl font-semibold text-[#071f41]">
                Create Recurring Block
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Schedule a consistent office hour time for the entire semester.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close recurring block modal"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-[#071f41]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-8 px-6 py-6 sm:px-8">
          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Session Type
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              {sessionTypeOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = option.id === selectedType;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedType(option.id)}
                    className={`rounded-[26px] border px-5 py-5 text-left transition ${
                      isSelected
                        ? "border-[#071f41] bg-[#071f41] text-white shadow-[0_20px_50px_-32px_rgba(7,31,65,0.85)]"
                        : "border-slate-200 bg-white text-[#071f41] hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span
                        className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${
                          isSelected
                            ? "bg-white/10 text-white"
                            : "bg-[#eef5ff] text-[#071f41]"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      {isSelected ? <Check className="h-5 w-5" /> : null}
                    </div>
                    <h3 className="mt-4 text-base font-semibold">
                      {option.label}
                    </h3>
                    <p
                      className={`mt-2 text-sm leading-6 ${
                        isSelected ? "text-slate-200" : "text-slate-500"
                      }`}
                    >
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef5ff] text-[#071f41]">
                <ClipboardPenLine className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Session Details
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Configure the recurring block details and time window.
                </p>
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#071f41]">
                Block Name
              </span>
              <input
                type="text"
                value={blockName}
                maxLength={BLOCK_NAME_MAX_LENGTH}
                onChange={(event) => setBlockName(event.target.value)}
                placeholder="e.g. Exam Review or Kernel Synchronization"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#071f41]"
              />
              <FieldCharLimitHint maxLength={BLOCK_NAME_MAX_LENGTH} />
            </label>

            <div>
              <span className="mb-2 block text-sm font-medium text-[#071f41]">
                Repeats On
              </span>
              <div className="flex flex-wrap gap-3">
                {weekdayOptions.map((day) => {
                  const isSelected = selectedDays.includes(day.id);

                  return (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => toggleDay(day.id)}
                      className={`inline-flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold transition ${
                        isSelected
                          ? "border-[#071f41] bg-[#071f41] text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#071f41]">
                  Start Date
                </span>
                <input
                  type="date"
                  value={validFromDate}
                  onChange={(event) => setValidFromDate(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#071f41]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#071f41]">
                  End Date
                </span>
                <input
                  type="date"
                  value={validUntilDate}
                  onChange={(event) => setValidUntilDate(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#071f41]"
                />
              </label>
            </div>

            <p className="text-xs leading-5 text-slate-500">
              Sessions generate on the selected weekdays between these dates
              (inclusive). Defaults are based on term {termCode}.
            </p>

            <OfficeHourTimeFields
              startTime={startTime}
              endTime={endTime}
              onStartTimeChange={setStartTime}
              onEndTimeChange={setEndTime}
            />
          </section>

          <section>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#071f41]">
                Room or Link
              </span>
              <input
                type="text"
                value={locationDetail}
                maxLength={LOCATION_MAX_LENGTH}
                onChange={(event) => setLocationDetail(event.target.value)}
                placeholder="Room 402 or Zoom"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#071f41]"
              />
              <FieldCharLimitHint maxLength={LOCATION_MAX_LENGTH} />
            </label>
          </section>

          <section>
            <OfficeHourHostSelect
              id="recurring-block-hosts"
              staff={staff}
              value={hostPublicIds}
              onChange={setHostPublicIds}
              label="Default Hosts"
              hint="Leave empty (TBD) to assign hosts per session later. You can override hosts on individual sessions from the calendar."
            />
          </section>

          <section className="rounded-[26px] border border-[#d7e7ff] bg-[#eef5ff] px-5 py-4">
            <p className="text-sm leading-6 text-slate-600">
              Scheduled blocks repeat weekly between your start and end dates.
              Adjust the date range above if this block should not run for the
              full term.
            </p>
          </section>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-[#071f41] transition hover:border-slate-300 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={submitting || selectedDays.length === 0}
            className="inline-flex items-center justify-center rounded-full bg-[#071f41] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0f2942] disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Create Recurring Block"}
          </button>
        </div>
      </div>
    </div>
  );
}
