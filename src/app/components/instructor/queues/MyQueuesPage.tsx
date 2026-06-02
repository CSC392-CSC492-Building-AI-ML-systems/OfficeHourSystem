import { CalendarDays, ChevronRight } from "lucide-react";
import { Navbar } from "../Navbar";
import { DUMMY_QUEUE_SESSIONS } from "./data";
import { QueueSessionCard } from "./QueueSessionCard";

export default function MyQueuesPage() {
  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <Navbar activeItem="queues" />

        <main className="mt-10 space-y-8">
          <section className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-[#071f41] sm:text-[2.1rem]">
              My Queues
            </h1>
            <p className="text-base text-slate-600">
              Launch your assigned queue sessions and keep live support moving.
            </p>
          </section>

          <section className="rounded-[32px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_50px_-30px_rgba(15,41,66,0.35)] sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef5ff] text-[#071f41]">
                  <CalendarDays className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-[#071f41]">
                    Upcoming Debugging Sessions
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Open the next session workspace when students begin checking
                    in.
                  </p>
                </div>
              </div>

              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-[#f8fafc] px-4 py-2 text-sm font-medium text-[#071f41]">
                WEEKLY VIEW
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </span>
            </div>

            <div className="mt-8 grid gap-5 xl:grid-cols-2">
              {DUMMY_QUEUE_SESSIONS.map((session) => (
                <QueueSessionCard key={session.id} session={session} />
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
