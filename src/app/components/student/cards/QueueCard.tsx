import { Globe, MapPin, UserRound } from "lucide-react";
import { InterestedButton } from "./InterestedButton";

interface QueueCardProps {
  location: string;
  isOnline?: boolean;
}

export function QueueCard({ location, isOnline = false }: QueueCardProps) {
  return (
    <div className="rounded-2xl border border-[#d8e5f2] bg-[#f5faff] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-base font-semibold text-[#071f41]">
            <UserRound className="h-4 w-4 text-slate-400" />
            <span>TA Office Hour</span>
          </h3>
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
            <span>{location}</span>
          </p>
        </div>

        <InterestedButton />
      </div>
    </div>
  );
}
