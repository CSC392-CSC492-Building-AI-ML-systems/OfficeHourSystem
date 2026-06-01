"use client";

import { FormEvent, useEffect, useState } from "react";
import { UserPlus, X } from "lucide-react";
import { StaffMember } from "./data";

interface AddTaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStaffMember: (member: StaffMember) => void;
}

type StaffRole = StaffMember["role"];
type LocationMode = "in-person" | "remote";

const inputClassName =
  "w-full rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#071f41] focus:bg-white";

const initialRole: StaffRole = "TA";

export function AddTaModal({
  isOpen,
  onClose,
  onAddStaffMember,
}: AddTaModalProps) {
  const [name, setName] = useState("");
  const [program, setProgram] = useState("");
  const [role, setRole] = useState<StaffRole>(initialRole);
  const [email, setEmail] = useState("");
  const [locationMode, setLocationMode] = useState<LocationMode>("in-person");
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
    setName("");
    setProgram("");
    setRole(initialRole);
    setEmail("");
    setLocationMode("in-person");
    setLocation("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedProgram = program.trim();
    const trimmedEmail = email.trim();
    const trimmedLocation = location.trim();

    if (!trimmedName || !trimmedProgram || !trimmedEmail || !trimmedLocation) {
      return;
    }

    // TODO: Persist added staff through the backend once that integration is available.
    onAddStaffMember({
      id: `staff-${Date.now()}`,
      name: trimmedName,
      program: trimmedProgram,
      role,
      email: trimmedEmail,
      location: trimmedLocation,
      isRemote: locationMode === "remote",
    });

    resetForm();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#071f41]/55 px-4 py-8 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-2xl overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-[0_24px_70px_-32px_rgba(7,31,65,0.55)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-slate-500">
              STAFF MANAGEMENT
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[#071f41]">
              Add teaching assistant
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close add TA form"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-[#071f41]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-5 px-6 py-6 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[#071f41]">Name</span>
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={inputClassName}
              placeholder="e.g. Maya Patel"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-[#071f41]">
              Program
            </span>
            <input
              required
              value={program}
              onChange={(event) => setProgram(event.target.value)}
              className={inputClassName}
              placeholder="e.g. Grad Student"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-[#071f41]">Role</span>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as StaffRole)}
              className={inputClassName}
            >
              <option value="TA">TA</option>
              <option value="Lead TA">Lead TA</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-[#071f41]">Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClassName}
              placeholder="name@university.edu"
            />
          </label>

          <div className="space-y-2">
            <span className="text-sm font-semibold text-[#071f41]">
              Location type
            </span>
            <div className="grid grid-cols-2 rounded-full border border-slate-200 bg-[#f8fafc] p-1">
              {(["in-person", "remote"] as LocationMode[]).map((mode) => {
                const isSelected = locationMode === mode;

                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setLocationMode(mode)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      isSelected
                        ? "bg-[#071f41] text-white shadow-sm"
                        : "text-slate-500 hover:text-[#071f41]"
                    }`}
                  >
                    {mode === "in-person" ? "In person" : "Remote"}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-[#071f41]">
              Office location
            </span>
            <input
              required
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className={inputClassName}
              placeholder={
                locationMode === "remote" ? "Remote (Zoom)" : "Room 402"
              }
            />
          </label>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-[#f8fafc] px-6 py-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-[#071f41]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#071f41] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(7,31,65,0.7)] transition hover:bg-[#0f2942]"
          >
            <UserPlus className="h-4 w-4" />
            Add TA
          </button>
        </div>
      </form>
    </div>
  );
}
