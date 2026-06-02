import type { OnDutyTA } from "./types";

interface OnDutyTAsCardProps {
  tas: OnDutyTA[];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function OnDutyTAsCard({ tas }: OnDutyTAsCardProps) {
  return (
    <section className="rounded-[30px] border border-[#d7e7ff] bg-[#eef5ff] p-6 shadow-[0_18px_50px_-30px_rgba(15,41,66,0.25)]">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#071f41]">On-Duty TAs</h2>
        <span className="text-sm font-medium text-slate-600">2 Active</span>
      </div>

      <div className="mt-5 space-y-4">
        {tas.map((ta) => (
          <div
            key={ta.id}
            className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/80 p-3"
          >
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#071f41] text-sm font-semibold text-white">
              {getInitials(ta.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[#071f41]">{ta.name}</p>
              <p className="text-sm text-slate-600">{ta.statusLabel}</p>
            </div>
            <span
              className={`h-3.5 w-3.5 rounded-full ${
                ta.status === "active" ? "bg-[#22c55e]" : "bg-[#f4d84d]"
              }`}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
