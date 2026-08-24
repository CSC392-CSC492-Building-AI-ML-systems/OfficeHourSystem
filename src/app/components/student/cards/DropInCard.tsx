import { Clock3, MapPin, UserRound } from "lucide-react";
import { LocationText } from "@/app/components/student/LocationText";
import { InterestedButton } from "./InterestedButton";

interface DropInCardProps {
  sessionId: number;
  sessionPublicId: string;
  title: string;
  time: string;
  location?: string;
  courseLabel: string;
  isInterested?: boolean;
}

export function DropInCard({
  sessionId,
  title,
  time,
  location,
  courseLabel,
  isInterested = false,
}: DropInCardProps) {
  return (
    <div className="rounded-2xl border border-[#d8e5f2] bg-[#f5faff] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#1e4fa1]">
            {courseLabel}
          </p>
          <h3 className="text-base font-semibold text-[#071f41]">{title}</h3>
          <div className="space-y-2 text-sm text-slate-600">
            <p className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-slate-400" />
              <span>{time}</span>
            </p>
            {location ? (
              <p className="flex min-w-0 items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <LocationText value={location} className="break-all" />
              </p>
            ) : null}
            <p className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-slate-400" />
              <span>Hosted by Teaching Team</span>
            </p>
          </div>
        </div>

        <InterestedButton
          sessionId={sessionId}
          initiallyInterested={isInterested}
        />
      </div>
    </div>
  );
}
