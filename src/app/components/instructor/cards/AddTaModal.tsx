"use client";

import { FormEvent, useEffect, useState } from "react";
import { UserPlus, X } from "lucide-react";
import type { StaffMember } from "./data";

interface AddTaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStaffMember: (staffMember: StaffMember) => void;
}

type StaffRole = StaffMember["role"];
type LocationType = "in-person" | "remote";

const initialRole: StaffRole = "TA";
const initialLocationType: LocationType = "in-person";

export function AddTaModal({
  isOpen,
  onClose,
  onAddStaffMember,
}: AddTaModalProps) {
  const [utorid, setUtorid] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [program, setProgram] = useState("");
  const [role, setRole] = useState<StaffRole>(initialRole);
  const [locationType, setLocationType] =
    useState<LocationType>(initialLocationType);
  const [location, setLocation] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const resetForm = () => {
    setUtorid("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setProgram("");
    setRole(initialRole);
    setLocationType(initialLocationType);
    setLocation("");
  };

  const isFormValid =
    utorid.trim().length > 0 &&
    program.trim().length > 0 &&
    location.trim().length > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFormValid) {
      return;
    }

    const trimmedUtorid = utorid.trim();
    const displayName =
      [firstName.trim(), lastName.trim()].filter(Boolean).join(" ") ||
      trimmedUtorid;

    onAddStaffMember({
      id: `local-${Date.now()}`,
      utorid: trimmedUtorid,
      name: displayName,
      email: email.trim(),
      program: program.trim(),
      role,
      location: location.trim(),
      isRemote: locationType === "remote",
    });
    resetForm();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#071f41]/55 px-4 py-8 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_70px_-28px_rgba(7,31,65,0.55)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-slate-500">
              STAFF MANAGEMENT
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[#071f41]">
              Add teaching assistant
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              UTORid is required. Name and email can be added later.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close add TA modal"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          <label className="block space-y-2 text-sm font-medium text-[#071f41]">
            <span>UTORid</span>
            <input
              required
              value={utorid}
              onChange={(event) => setUtorid(event.target.value)}
              placeholder="jlee1234"
              className="w-full rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#071f41] focus:bg-white"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-[#071f41]">
              <span>First name (optional)</span>
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="Jordan"
                className="w-full rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#071f41] focus:bg-white"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-[#071f41]">
              <span>Last name (optional)</span>
              <input
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Lee"
                className="w-full rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#071f41] focus:bg-white"
              />
            </label>
          </div>

          <label className="block space-y-2 text-sm font-medium text-[#071f41]">
            <span>Email (optional)</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="j.lee@mail.utoronto.ca"
              className="w-full rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#071f41] focus:bg-white"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-[#071f41]">
              <span>Program</span>
              <input
                required
                value={program}
                onChange={(event) => setProgram(event.target.value)}
                placeholder="Senior Undergraduate"
                className="w-full rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#071f41] focus:bg-white"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-[#071f41]">
              <span>Role</span>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as StaffRole)}
                className="w-full rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#071f41] focus:bg-white"
              >
                <option value="TA">TA</option>
                <option value="Lead TA">Lead TA</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 text-sm font-medium text-[#071f41]">
              <span>Location type</span>
              <div className="grid grid-cols-2 rounded-2xl border border-slate-200 bg-[#f8fafc] p-1">
                {(["in-person", "remote"] as LocationType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setLocationType(type)}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                      locationType === type
                        ? "bg-[#071f41] text-white shadow-[0_12px_24px_-20px_rgba(7,31,65,0.8)]"
                        : "text-slate-500 hover:text-[#071f41]"
                    }`}
                  >
                    {type === "in-person" ? "In person" : "Remote"}
                  </button>
                ))}
              </div>
            </div>

            <label className="space-y-2 text-sm font-medium text-[#071f41]">
              <span>Office location</span>
              <input
                required
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder={
                  locationType === "remote"
                    ? "Remote (Zoom)"
                    : "Tech Plaza, Rm 402"
                }
                className="w-full rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#071f41] focus:bg-white"
              />
            </label>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#071f41] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(7,31,65,0.7)] transition hover:bg-[#0f2942] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              <UserPlus className="h-4 w-4" />
              Add TA
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
