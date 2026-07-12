"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Mail, Search, Trash2 } from "lucide-react";
import type { OfferingStaffMember } from "@/lib/queries/offeringMember";

interface StaffTableProps {
  staff: OfferingStaffMember[];
  canEdit: boolean;
  onRemoveStaffMember: (staffMemberId: string) => void;
  removingStaffMemberId: string | null;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function StaffTable({
  staff,
  canEdit,
  onRemoveStaffMember,
  removingStaffMemberId,
}: StaffTableProps) {
  const [query, setQuery] = useState("");

  const filteredStaff = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return staff;
    }

    return staff.filter((member) =>
      [member.name, member.role, member.email, member.utorid]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query, staff]);

  return (
    <section className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-[0_18px_50px_-30px_rgba(15,41,66,0.35)]">
      <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#071f41]">
            Current Teaching Assistants
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Search, review, and manage the staff roster for this course.
          </p>
        </div>

        <label className="relative block w-full max-w-sm">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search staff..."
            className="w-full rounded-full border border-slate-200 bg-[#f8fafc] py-2.5 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#071f41]"
          />
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-[#f8fafc] text-left text-xs font-semibold tracking-[0.18em] text-slate-500">
              <th className="px-6 py-4">STAFF MEMBER</th>
              <th className="px-6 py-4">ROLE</th>
              <th className="px-6 py-4">CONTACT INFO</th>
              {canEdit ? (
                <th className="px-6 py-4 text-right">ACTIONS</th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStaff.map((member) => (
              <tr
                key={member.id}
                className="text-sm text-slate-700 transition hover:bg-[#fbfdff]"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#eaf1ff] text-sm font-semibold text-[#071f41]">
                      {getInitials(member.name)}
                    </div>
                    <div>
                      <p className="font-semibold text-[#071f41]">
                        {member.name}
                      </p>
                      <p className="text-sm text-slate-500">{member.utorid}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      member.role === "Instructor"
                        ? "bg-[#071f41] text-white"
                        : "bg-[#e8eef5] text-[#5b6b80]"
                    }`}
                  >
                    {member.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span>{member.email || "—"}</span>
                  </div>
                </td>
                {canEdit ? (
                  <td className="px-6 py-4 text-right">
                    {member.role === "TA" ? (
                      <button
                        type="button"
                        aria-label={`Remove ${member.name}`}
                        onClick={() => onRemoveStaffMember(member.id)}
                        disabled={removingStaffMemberId === member.id}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-[#9f1239] transition hover:border-[#fecdd3] hover:bg-[#fff1f2] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 className="h-4 w-4" />
                        {removingStaffMemberId === member.id
                          ? "Removing..."
                          : "Remove"}
                      </button>
                    ) : (
                      <span className="text-sm text-slate-400">—</span>
                    )}
                  </td>
                ) : null}
              </tr>
            ))}
            {filteredStaff.length === 0 ? (
              <tr>
                <td
                  colSpan={canEdit ? 4 : 3}
                  className="px-6 py-10 text-center text-sm text-slate-500"
                >
                  {staff.length === 0
                    ? "No teaching staff have been added yet."
                    : "No staff members match your search."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 text-sm text-slate-500">
        <span>
          Showing {filteredStaff.length} of {staff.length} staff members
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous page"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next page"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
