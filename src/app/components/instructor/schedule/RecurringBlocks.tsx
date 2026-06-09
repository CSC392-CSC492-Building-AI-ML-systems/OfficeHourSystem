import { Clock3, MapPin, Pencil, Repeat2, Video } from "lucide-react";
import type { RecurringRule } from "./types";

interface RecurringBlocksProps {
  blocks: RecurringRule[];
  canEdit?: boolean;
  onEditBlock?: (block: RecurringRule) => void;
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
}: RecurringBlocksProps) {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold text-[#071f41]">
            Recurring Schedule Rules
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            These rules generate the default weekly office hour sessions.
            Editing a rule affects future weeks, while session overrides only
            affect a specific occurrence.
          </p>
        </div>
        {canEdit && blocks.length > 0 ? (
          <p className="w-fit text-sm text-slate-500">
            Use the edit icon on a rule to change or delete a block.
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {blocks.map((block) => (
          <article
            key={block.id}
            className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_50px_-30px_rgba(15,41,66,0.35)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-3">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeClasses[block.accent]}`}
                >
                  {block.courseCode}
                </span>
                <span className="inline-flex rounded-full border border-slate-200 bg-[#f8fafc] px-3 py-1 text-[11px] font-medium tracking-[0.12em] text-slate-500">
                  Recurring Rule
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
                <Repeat2 className="h-4 w-4 text-slate-400" />
                <span>
                  <span className="font-medium text-slate-700">Repeats:</span>{" "}
                  {block.repeats}
                </span>
              </p>
              <p className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-slate-400" />
                <span>
                  <span className="font-medium text-slate-700">
                    Default Time:
                  </span>{" "}
                  {block.defaultTime}
                </span>
              </p>
              <p className="flex items-center gap-2">
                {block.mode === "online" ? (
                  <Video className="h-4 w-4 text-slate-400" />
                ) : (
                  <MapPin className="h-4 w-4 text-slate-400" />
                )}
                <span>
                  <span className="font-medium text-slate-700">
                    Default Location:
                  </span>{" "}
                  {block.defaultLocation}
                </span>
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
