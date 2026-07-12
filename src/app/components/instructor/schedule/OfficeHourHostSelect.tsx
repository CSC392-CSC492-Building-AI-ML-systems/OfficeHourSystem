"use client";

import type { ScheduleStaffMember } from "./types";

interface OfficeHourHostSelectProps {
  staff: ScheduleStaffMember[];
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  hint?: string;
  id?: string;
}

function staffRoleLabel(role: string) {
  return role === "INSTRUCTOR" ? "Instructor" : "TA";
}

export function OfficeHourHostSelect({
  staff,
  value,
  onChange,
  label = "Session Hosts",
  hint,
  id,
}: OfficeHourHostSelectProps) {
  const toggleHost = (publicId: string) => {
    onChange(
      value.includes(publicId)
        ? value.filter((currentId) => currentId !== publicId)
        : [...value, publicId],
    );
  };

  return (
    <fieldset id={id}>
      <legend className="mb-2 block text-sm font-medium text-[#071f41]">
        {label}
      </legend>

      {staff.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 py-3 text-sm text-slate-500">
          No instructors or TAs are listed for this course yet.
        </p>
      ) : (
        <div className="max-h-48 space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3">
          {staff.map((member) => {
            const inputId = `${id ?? "host-select"}-${member.publicId}`;
            const isSelected = value.includes(member.publicId);

            return (
              <label
                key={member.publicId}
                htmlFor={inputId}
                className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 transition ${
                  isSelected
                    ? "bg-[#eef5ff] text-[#071f41]"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <input
                  id={inputId}
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleHost(member.publicId)}
                  className="h-4 w-4 rounded border-slate-300 text-[#071f41] focus:ring-[#071f41]"
                />
                <span className="text-sm">
                  {member.name} ({staffRoleLabel(member.role)})
                </span>
              </label>
            );
          })}
        </div>
      )}

      {hint ? (
        <p className="mt-2 text-xs leading-5 text-slate-500">{hint}</p>
      ) : null}
    </fieldset>
  );
}
