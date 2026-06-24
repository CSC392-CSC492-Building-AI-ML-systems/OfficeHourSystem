import { Clock3, Users } from "lucide-react";
import { InterestedButton } from "./InterestedButton";

interface GroupTopicCardProps {
  topic: string;
  timeString: string;
  courseCode: string;
}

export function GroupTopicCard({
  topic,
  timeString,
  courseCode,
}: GroupTopicCardProps) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-[#d8e5f2] bg-[#f5faff] p-4">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#0f5f8f]">
          {courseCode}
        </p>
        <h3 className="flex items-center gap-2 text-base font-semibold text-[#071f41]">
          <Users className="h-4 w-4 text-slate-400" />
          <span>{topic}</span>
        </h3>
        <p className="flex items-center gap-2 text-sm text-slate-600">
          <Clock3 className="h-4 w-4 text-slate-400" />
          <span>{timeString}</span>
        </p>
      </div>

      <InterestedButton />
    </div>
  );
}
