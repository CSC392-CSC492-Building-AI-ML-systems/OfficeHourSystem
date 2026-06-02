"use client";

import { useEffect, useState } from "react";
import {
  Bug,
  CalendarRange,
  Check,
  Layers3,
  MapPinned,
  MonitorPlay,
  Users,
  X,
} from "lucide-react";

type SessionType = "drop-in" | "debugging-queue" | "topic-group";
type ScheduleDay = "mon" | "tue" | "wed" | "thu" | "fri";
type LocationMode = "in-person" | "online" | "hybrid";

interface CreateRecurringBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
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
    label: "Debugging Queue",
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

const locationModes: Array<{ id: LocationMode; label: string }> = [
  { id: "in-person", label: "In-person" },
  { id: "online", label: "Online" },
  { id: "hybrid", label: "Hybrid" },
];

export function CreateRecurringBlockModal({
  isOpen,
  onClose,
}: CreateRecurringBlockModalProps) {
  const [selectedType, setSelectedType] = useState<SessionType>("drop-in");
  const [selectedDays, setSelectedDays] = useState<ScheduleDay[]>([
    "mon",
    "wed",
    "fri",
  ]);
  const [startTime, setStartTime] = useState("14:00");
  const [endTime, setEndTime] = useState("16:00");
  const [locationMode, setLocationMode] = useState<LocationMode>("in-person");
  const [locationDetail, setLocationDetail] = useState("Room 402 or Zoom Link");
  const [topic, setTopic] = useState("");
  const [maxSeats, setMaxSeats] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

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
                <Layers3 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Recurring Schedule
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Select the weekly pattern for this block.
                </p>
              </div>
            </div>

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

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#071f41]">
                  Start Time
                </span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#071f41]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#071f41]">
                  End Time
                </span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#071f41]"
                />
              </label>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Location Details
              </span>
              <div className="relative">
                <MapPinned className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  value={locationMode}
                  onChange={(event) =>
                    setLocationMode(event.target.value as LocationMode)
                  }
                  className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm text-slate-700 outline-none transition focus:border-[#071f41]"
                >
                  {locationModes.map((mode) => (
                    <option key={mode.id} value={mode.id}>
                      {mode.label}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#071f41]">
                Room or Link
              </span>
              <input
                type="text"
                value={locationDetail}
                onChange={(event) => setLocationDetail(event.target.value)}
                placeholder="Room 402 or Zoom Link"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#071f41]"
              />
            </label>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef5ff] text-[#071f41]">
                <MonitorPlay className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Group Constraints
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Optional details for topic-focused or capacity-limited
                  sessions.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#071f41]">
                  Topic
                </span>
                <input
                  type="text"
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  placeholder="Topic: e.g. Final Exam Review"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#071f41]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#071f41]">
                  Max Seats
                </span>
                <input
                  type="text"
                  value={maxSeats}
                  onChange={(event) => setMaxSeats(event.target.value)}
                  placeholder="Max Seats"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#071f41]"
                />
              </label>
            </div>
          </section>

          <section className="rounded-[26px] border border-[#d7e7ff] bg-[#eef5ff] px-5 py-4">
            <p className="text-sm leading-6 text-slate-600">
              Scheduled blocks will repeat weekly until the end of the current
              term. TAs assigned to these slots will be automatically notified
              24 hours before each session.
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
            onClick={handleClose}
            className="inline-flex items-center justify-center rounded-full bg-[#071f41] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0f2942]"
          >
            Create Recurring Block
          </button>
        </div>
      </div>
    </div>
  );
}
