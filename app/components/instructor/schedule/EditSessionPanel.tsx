"use client";

import { useState } from "react";
import { CalendarClock, ChevronDown } from "lucide-react";
import type { ScheduleSession } from "./types";

interface EditSessionPanelProps {
  selectedSession: ScheduleSession;
}

function formatSelectedBlockTitle(session: ScheduleSession) {
  if (session.courseName) {
    return `${session.courseCode}: ${session.courseName}`;
  }

  return session.courseCode;
}

export function EditSessionPanel({ selectedSession }: EditSessionPanelProps) {
  const [hasLocationOverride, setHasLocationOverride] = useState(
    selectedSession.hasLocationOverride ?? false,
  );
  const [locationValue, setLocationValue] = useState(
    selectedSession.overrideLocation ?? selectedSession.location,
  );
  const [savedMessage, setSavedMessage] = useState("");

  const defaultLocation = selectedSession.location;
  const overrideLocation =
    selectedSession.overrideLocation ?? selectedSession.location;

  const handleToggleOverride = () => {
    setSavedMessage("");
    const nextValue = !hasLocationOverride;
    setHasLocationOverride(nextValue);
    setLocationValue(nextValue ? overrideLocation : defaultLocation);
  };

  const handleSaveOverride = () => {
    setSavedMessage(
      hasLocationOverride
        ? "Override details are stored locally for this selected session preview."
        : "This session is currently using the default recurring location.",
    );
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
          SELECTED BLOCK
        </p>
        <h3 className="mt-2 text-lg font-semibold text-[#071f41]">
          {formatSelectedBlockTitle(selectedSession)}
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          {selectedSession.dateLabel}, {selectedSession.startTime} -{" "}
          {selectedSession.endTime}
        </p>
      </div>

      <div className="mt-6 space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-[#071f41]">
            Session Topic
          </label>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            {selectedSession.topic}
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Updating this only affects the {selectedSession.startTime} session{" "}
            {selectedSession.dateLabel.toLowerCase() === "today"
              ? "today."
              : `on ${selectedSession.dateLabel}.`}
          </p>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium text-[#071f41]">
              Location Override
            </label>
            <button
              type="button"
              aria-pressed={hasLocationOverride}
              onClick={handleToggleOverride}
              className={`relative inline-flex h-7 w-12 rounded-full p-1 transition ${
                hasLocationOverride ? "bg-[#c8102e]" : "bg-slate-300"
              }`}
            >
              <span
                className={`h-5 w-5 rounded-full bg-white shadow-sm transition ${
                  hasLocationOverride ? "ml-auto" : ""
                }`}
              />
            </button>
          </div>

          <div
            className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${
              hasLocationOverride
                ? "border-slate-200 bg-white text-slate-700"
                : "border-slate-200 bg-slate-50 text-slate-500"
            }`}
          >
            <input
              type="text"
              value={hasLocationOverride ? locationValue : defaultLocation}
              onChange={(event) => setLocationValue(event.target.value)}
              disabled={!hasLocationOverride}
              className="w-full bg-transparent outline-none disabled:cursor-not-allowed"
            />
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {hasLocationOverride
              ? "This override only affects this specific session occurrence."
              : "This session is using the default recurring location."}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleSaveOverride}
          className="inline-flex items-center justify-center rounded-full bg-[#071f41] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0f2942]"
        >
          Save Override
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full border border-[#c8102e] px-5 py-3 text-sm font-semibold text-[#c8102e] transition hover:bg-[#fff1f2]"
        >
          Cancel Session
        </button>
      </div>
      {savedMessage ? (
        <p className="mt-3 text-sm text-slate-500">{savedMessage}</p>
      ) : null}
    </section>
  );
}
