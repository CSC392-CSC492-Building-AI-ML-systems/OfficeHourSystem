"use client";

import { useMemo, useState } from "react";
import { UserPlus } from "lucide-react";
import { Navbar } from "./Navbar";
import { AddTaModal } from "./cards/AddTaModal";
import { DUMMY_STAFF, type StaffMember } from "./cards/data";
import { StatCard } from "./cards/StatCard";
import { StaffTable } from "./cards/StaffTable";

type InstructorDashboardProps = {
  offeringPublicId: string;
  courseLabel: string;
};

export default function InstructorDashboard({
  offeringPublicId,
  courseLabel,
}: InstructorDashboardProps) {
  const [staff, setStaff] = useState<StaffMember[]>(DUMMY_STAFF);
  const [isAddTaModalOpen, setIsAddTaModalOpen] = useState(false);

  const leadCount = useMemo(
    () => staff.filter((member) => member.role === "Lead TA").length,
    [staff],
  );

  const handleAddStaffMember = (staffMember: StaffMember) => {
    setStaff((currentStaff) => [staffMember, ...currentStaff]);
    setIsAddTaModalOpen(false);
  };

  const handleRemoveStaffMember = (staffMemberId: string) => {
    setStaff((currentStaff) =>
      currentStaff.filter((member) => member.id !== staffMemberId),
    );
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <Navbar
          activeItem="dashboard"
          offeringPublicId={offeringPublicId}
          courseLabel={courseLabel}
        />

        <main className="mt-10 space-y-8">
          <section className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-[#071f41] sm:text-[2.1rem]">
                Staff Management
              </h1>
              <p className="text-base text-slate-600">{courseLabel}</p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddTaModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#071f41] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(7,31,65,0.7)] transition hover:bg-[#0f2942]"
            >
              <UserPlus className="h-4 w-4" />
              Add TA
            </button>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <StatCard label="TOTAL STAFF" value={staff.length.toString()} />
            <StatCard
              label="ACTIVE LEADS"
              value={leadCount.toString().padStart(2, "0")}
              valueClassName="text-[#c8102e]"
            />
            <StatCard
              label="WEEKLY SLOTS"
              value="42"
              valueClassName="text-[#8a5a17]"
            />
          </section>

          <StaffTable
            staff={staff}
            onRemoveStaffMember={handleRemoveStaffMember}
          />
        </main>
      </div>

      <AddTaModal
        isOpen={isAddTaModalOpen}
        onClose={() => setIsAddTaModalOpen(false)}
        onAddStaffMember={handleAddStaffMember}
      />
    </div>
  );
}
