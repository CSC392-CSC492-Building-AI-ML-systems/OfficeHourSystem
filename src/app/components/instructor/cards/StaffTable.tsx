"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Mail, Search, Trash2 } from "lucide-react";
import { removeTaAction } from "@/actions/command-center/command-center";
import {
  formatTaDisplayName,
  getTaInitials,
  taMatchesSearch,
  type TaListItem,
} from "./data";

const PAGE_SIZE = 5;
const INSTRUCTOR_ONLY_HINT = "Only instructors can add or remove TAs.";

interface StaffTableProps {
  tas: TaListItem[];
  canManageTas: boolean;
  onRemoveSuccess: () => void;
}

export function StaffTable({
  tas,
  canManageTas,
  onRemoveSuccess,
}: StaffTableProps) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredTas = useMemo(
    () => tas.filter((ta) => taMatchesSearch(ta, query)),
    [query, tas],
  );

  const totalPages = Math.max(1, Math.ceil(filteredTas.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const paginatedTas = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredTas.slice(start, start + PAGE_SIZE);
  }, [filteredTas, currentPage]);

  const rangeStart =
    filteredTas.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filteredTas.length);

  const emptyMessage =
    tas.length === 0
      ? "No teaching assistants have been added yet."
      : "No teaching assistants match your search.";

  const handleRemove = (ta: TaListItem) => {
    if (!canManageTas) {
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        const result = await removeTaAction(ta.userPublicId);

        if (result.outcome === "not_found") {
          setError("Teaching assistant not found.");
          return;
        }

        onRemoveSuccess();
      } catch (removeError) {
        setError(
          removeError instanceof Error
            ? removeError.message
            : "Unable to remove teaching assistant.",
        );
      }
    });
  };

  return (
    <section className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-[0_18px_50px_-30px_rgba(15,41,66,0.35)]">
      <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#071f41]">
            Current Teaching Assistants
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {canManageTas
              ? "Search, review, and manage the TA roster for this course."
              : "Search and review the TA roster for this course."}
          </p>
        </div>

        <label className="relative block w-full max-w-sm">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Search by name, UTORid, or email..."
            aria-label="Search teaching assistants"
            className="w-full rounded-full border border-slate-200 bg-[#f8fafc] py-2.5 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#071f41]"
          />
        </label>
      </div>

      {error ? (
        <div className="border-b border-slate-200 px-6 py-4">
          <p className="rounded-2xl border border-[#fecdd3] bg-[#fff1f2] px-4 py-3 text-sm font-medium text-[#9f1239]">
            {error}
          </p>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-[38%]" />
            <col className="w-[37%]" />
            <col className="w-[25%]" />
          </colgroup>
          <thead>
            <tr className="bg-[#f8fafc] text-left text-xs font-semibold tracking-[0.18em] text-slate-500">
              <th className="px-6 py-4">TA</th>
              <th className="px-6 py-4">CONTACT INFO</th>
              <th className="px-6 py-4">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedTas.map((ta) => (
              <tr
                key={ta.userPublicId}
                className="text-sm text-slate-700 transition hover:bg-[#fbfdff]"
              >
                <td className="px-6 py-4 align-middle">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eaf1ff] text-sm font-semibold text-[#071f41]">
                      {getTaInitials(ta)}
                    </div>
                    <p className="truncate font-semibold text-[#071f41]">
                      {formatTaDisplayName(ta)}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4 align-middle text-slate-600">
                  <div className="flex min-w-0 items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                    <span
                      className={`truncate ${ta.email ? "" : "italic text-slate-400"}`}
                    >
                      {ta.email ?? "Available after first sign-in"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 align-middle">
                  <button
                    type="button"
                    aria-label={`Remove ${formatTaDisplayName(ta)}`}
                    title={canManageTas ? undefined : INSTRUCTOR_ONLY_HINT}
                    disabled={!canManageTas || isPending}
                    onClick={() => handleRemove(ta)}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-[#9f1239] transition hover:border-[#fecdd3] hover:bg-[#fff1f2] disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {filteredTas.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-10 text-center text-sm text-slate-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span>
          {filteredTas.length === 0
            ? query.trim()
              ? `No results for "${query.trim()}" (${tas.length} total)`
              : `Showing 0 of ${tas.length} teaching assistants`
            : `Showing ${rangeStart}–${rangeEnd} of ${filteredTas.length} teaching assistants`}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium tracking-wide text-slate-400">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous page"
              disabled={currentPage <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next page"
              disabled={currentPage >= totalPages}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
