import { Clock3, MapPin, UserRound } from "lucide-react";
import { InterestedButton } from "./InterestedButton";

interface DropInCardProps {
  title: string;
  time: string;
  location?: string;
}

export function DropInCard({ title, time, location }: DropInCardProps) {
  return (
    <div className="rounded-2xl border border-[#d8e5f2] bg-[#f5faff] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-[#071f41]">{title}</h3>
          <div className="space-y-2 text-sm text-slate-600">
            <p className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-slate-400" />
              <span>{time}</span>
            </p>
            {location ? (
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span>{location}</span>
              </p>
            ) : null}
            <p className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-slate-400" />
              <span>Hosted by Teaching Team</span>
            </p>
          </div>
        </div>

        <InterestedButton />
      </div>
    </div>
  );
}
