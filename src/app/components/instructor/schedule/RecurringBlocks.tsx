import {
  CalendarRange,
  Clock3,
  MapPin,
  Pencil,
  PlusCircle,
  Repeat2,
  Video,
} from "lucide-react";
import type { RecurringRule } from "./types";

interface RecurringBlocksProps {
  blocks: RecurringRule[];
  canEdit?: boolean;
  onEditBlock?: (block: RecurringRule) => void;
  onCreateBlock?: () => void;
}

const badgeClasses = {
  navy: "bg-[#071f41] text-white",
  red: "bg-[#c8102e] text-white",
  gold: "bg-[#f4d84d] text-[#071f41]",
} as const;

export function RecurringBlocks({
  blocks,
  canEdit = false,
  onEditBlock,
  onCreateBlock,
}: RecurringBlocksProps) {
  return (
    <section className="space-y-5">
      <div className="max-w-3xl">
        <h2 className="text-2xl font-semibold text-[#071f41]">
          Recurring Schedule Rules
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          These rules generate the default weekly office hour sessions. Editing
          a rule affects future weeks, while session overrides only affect a
          specific occurrence.
          {canEdit && blocks.length > 0
            ? " Use the edit icon on a rule to change or delete a block."
            : null}
        </p>
      </div>

      {blocks.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-[0_18px_50px_-30px_rgba(15,41,66,0.2)]">
          <p className="text-sm leading-6 text-slate-600">
            No recurring schedule rules yet. Create a recurring block to
            generate weekly office hour sessions on the calendar.
          </p>
          {canEdit && onCreateBlock ? (
            <button
              type="button"
              onClick={onCreateBlock}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-[#071f41] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0f2942]"
            >
              <PlusCircle className="h-4 w-4" />
              Create Recurring Block
            </button>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {blocks.map((block) => (
            <article
              key={block.id}
              className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_50px_-30px_rgba(15,41,66,0.35)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeClasses[block.accent]}`}
                  >
                    {block.sessionTypeLabel}
                  </span>
                </div>

                {canEdit ? (
                  <button
                    type="button"
                    aria-label={`Edit ${block.title}`}
                    onClick={() => onEditBlock?.(block)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-[#071f41]"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              <h3 className="mt-4 text-lg font-semibold text-[#071f41]">
                {block.title}
              </h3>

              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p className="flex items-center gap-2">
                  <Repeat2 className="h-4 w-4 shrink-0 text-slate-400" />
                  <span>
                    <span className="font-medium text-slate-700">Repeats:</span>{" "}
                    {block.repeats}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <CalendarRange className="h-4 w-4 shrink-0 text-slate-400" />
                  <span>
                    <span className="font-medium text-slate-700">Valid:</span>{" "}
                    {block.validFrom} – {block.validUntil}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 shrink-0 text-slate-400" />
                  <span>
                    <span className="font-medium text-slate-700">
                      Default Time:
                    </span>{" "}
                    {block.defaultTime}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  {block.mode === "online" ? (
                    <Video className="h-4 w-4 shrink-0 text-slate-400" />
                  ) : (
                    <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                  )}
                  <span>
                    <span className="font-medium text-slate-700">
                      Default Location:
                    </span>{" "}
                    {block.defaultLocation}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-medium text-slate-700">Hosts:</span>{" "}
                  {block.hostLabel}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
