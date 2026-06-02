import Link from "next/link";
import { Clock3, MapPin } from "lucide-react";
import type { QueueSession } from "./types";

interface QueueSessionCardProps {
  session: QueueSession;
}

export function QueueSessionCard({ session }: QueueSessionCardProps) {
  return (
    <article
      className={`rounded-[30px] border bg-white p-6 shadow-[0_18px_50px_-30px_rgba(15,41,66,0.35)] ${
        session.isHighlighted
          ? "border-slate-200/80 border-l-4 border-l-[#c8102e]"
          : "border-slate-200/80"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {session.courseLabel}
      </p>
      <h3 className="mt-4 text-2xl font-semibold text-[#071f41]">
        {session.title}
      </h3>

      <div className="mt-5 space-y-3 text-sm text-slate-600">
        <p className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-slate-400" />
          <span>{session.time}</span>
        </p>
        <p className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-slate-400" />
          <span>{session.location}</span>
        </p>
      </div>

      <Link
        href={`/instructor/my-queues/active?sessionId=${session.id}`}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#071f41] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0f2942]"
      >
        Start Session ▶
      </Link>
    </article>
  );
}
