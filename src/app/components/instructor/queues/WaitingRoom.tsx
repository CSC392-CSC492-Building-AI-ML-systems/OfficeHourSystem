import { UserRound } from "lucide-react";
import type { QueueStudent } from "./types";

interface WaitingRoomProps {
  waitingStudents: QueueStudent[];
  hasActiveStudent: boolean;
  onStartStudent: (student: QueueStudent) => void;
}

export function WaitingRoom({
  waitingStudents,
  hasActiveStudent,
  onStartStudent,
}: WaitingRoomProps) {
  return (
    <section className="rounded-[30px] border border-slate-200/80 bg-white shadow-[0_18px_50px_-30px_rgba(15,41,66,0.35)]">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#071f41]">
            Queue (Waiting Room)
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Start the next student when you are ready for the next help session.
          </p>
        </div>

        <span className="inline-flex w-fit rounded-full border border-slate-200 bg-[#f8fafc] px-4 py-2 text-sm font-medium text-[#071f41]">
          {waitingStudents.length}{" "}
          {waitingStudents.length === 1 ? "Student" : "Students"} Waiting
        </span>
      </div>

      <div className="space-y-4 px-6 py-6">
        {waitingStudents.map((student, index) => (
          <article
            key={student.id}
            className="flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-[#f8fafc] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-center gap-4">
              <span className="inline-flex min-w-10 justify-center rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-[#071f41]">
                #{index + 1}
              </span>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#071f41] text-sm font-semibold text-white">
                {student.initials}
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-[#071f41]">
                  {student.name}
                </h3>
                <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                  <UserRound className="h-4 w-4" />
                  <span>{student.username}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={hasActiveStudent}
              onClick={() => onStartStudent(student)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#071f41] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0f2942] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              ▷ START
            </button>
          </article>
        ))}

        {waitingStudents.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-200 bg-[#f8fafc] px-6 py-8 text-center">
            <h3 className="text-lg font-semibold text-[#071f41]">
              No students are waiting.
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              New queue check-ins will appear here once they arrive.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
