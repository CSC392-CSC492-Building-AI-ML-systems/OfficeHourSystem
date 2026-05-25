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
            <span
              className={`relative inline-flex h-7 w-12 rounded-full p-1 ${
                selectedSession.hasLocationOverride
                  ? "bg-[#c8102e]"
                  : "bg-slate-300"
              }`}
            >
              <span
                className={`h-5 w-5 rounded-full bg-white shadow-sm transition ${
                  selectedSession.hasLocationOverride ? "ml-auto" : ""
                }`}
              />
            </span>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            <span>
              {selectedSession.overrideLocation ?? selectedSession.location}
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button className="inline-flex items-center justify-center rounded-full bg-[#071f41] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0f2942]">
          Save Override
        </button>
        <button className="inline-flex items-center justify-center rounded-full border border-[#c8102e] px-5 py-3 text-sm font-semibold text-[#c8102e] transition hover:bg-[#fff1f2]">
          Cancel Session
        </button>
      </div>
    </section>
  );
}
