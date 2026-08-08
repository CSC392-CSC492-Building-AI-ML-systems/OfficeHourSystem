import { Clock3, MapPin } from "lucide-react";
import { InterestedButton } from "./InterestedButton";

type SessionType = "REGULAR" | "DEBUGGING" | "GROUP";

const TYPE_STYLES: Record<
  SessionType,
  { label: string; badge: string; accent: string }
> = {
  REGULAR: {
    label: "Drop-In",
    badge: "bg-[#eaf1ff] text-[#1e4fa1]",
    accent: "border-l-[#1e4fa1]",
  },
  DEBUGGING: {
    label: "Help Centre",
    badge: "bg-[#fdecef] text-[#c8102e]",
    accent: "border-l-[#c8102e]",
  },
  GROUP: {
    label: "Group",
    badge: "bg-[#edf7ff] text-[#0f5f8f]",
    accent: "border-l-[#0f5f8f]",
  },
};

type SessionRowProps = {
  sessionId: number;
  type: SessionType;
  courseCode: string;
  title: string;
  time: string;
  location: string;
  isInterested?: boolean;
};

export function SessionRow({
  sessionId,
  type,
  courseCode,
  title,
  time,
  location,
  isInterested = false,
}: SessionRowProps) {
  const style = TYPE_STYLES[type];

  return (
    <div
      className={`flex items-start justify-between gap-4 rounded-2xl border border-[#d8e5f2] border-l-4 bg-white p-4 ${style.accent}`}
    >
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ${style.badge}`}
          >
            {style.label}
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            {courseCode}
          </span>
        </div>
        <h3 className="text-base font-semibold text-[#071f41]">{title}</h3>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
          <p className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 shrink-0 text-slate-400" />
            <span>{time}</span>
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
            <span>{location}</span>
          </p>
        </div>
      </div>

      <InterestedButton
        sessionId={sessionId}
        initiallyInterested={isInterested}
      />
    </div>
  );
}
