import { Clock3, Globe, MapPin, UserRound } from "lucide-react";
import { LocationText } from "@/app/components/student/LocationText";
import { InterestedButton } from "./InterestedButton";

interface QueueCardProps {
  sessionId: number;
  sessionPublicId: string;
  title: string;
  time: string;
  location: string;
  courseLabel: string;
  isOnline?: boolean;
  isInterested?: boolean;
}

export function QueueCard({
  sessionId,
  title,
  time,
  location,
  courseLabel,
  isOnline = false,
  isInterested = false,
}: QueueCardProps) {
  return (
    <div className="rounded-2xl border border-[#d8e5f2] bg-[#f5faff] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#c8102e]">
            {courseLabel}
          </p>
          <h3 className="flex items-center gap-2 text-base font-semibold text-[#071f41]">
            <UserRound className="h-4 w-4 text-slate-400" />
            <span>{title}</span>
          </h3>
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <Clock3 className="h-4 w-4 text-slate-400" />
            <span>{time}</span>
          </p>
          <p
            className={`flex items-center gap-2 text-sm font-medium ${
              isOnline ? "text-[#2563eb]" : "text-[#c8102e]"
            }`}
          >
            {isOnline ? (
              <Globe className="h-4 w-4" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
            <LocationText
              value={location}
              className="break-all"
              linkClassName="text-[#2563eb] underline underline-offset-2 hover:text-[#1d4ed8]"
            />
          </p>
        </div>

        <InterestedButton
          sessionId={sessionId}
          initiallyInterested={isInterested}
        />
      </div>
    </div>
  );
}
