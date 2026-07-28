"use client";

import { useMemo, useState } from "react";
import { UserPlus } from "lucide-react";
import {
  addOfferingTaAction,
  bulkAddOfferingTasAction,
  removeOfferingTaAction,
} from "@/actions/instructor/staff";
import { Navbar } from "./Navbar";
import { AddTaModal } from "./cards/AddTaModal";
import type { OfferingStaffMember } from "@/lib/queries/offeringMember";
import { StatCard } from "./cards/StatCard";
import { StaffTable } from "./cards/StaffTable";

type InstructorDashboardProps = {
  offeringPublicId: string;
  courseLabel: string;
  canEdit: boolean;
  initialStaff: OfferingStaffMember[];
  weeklySlotCount: number;
};

export default function InstructorDashboard({
  offeringPublicId,
  courseLabel,
  canEdit,
  initialStaff,
  weeklySlotCount,
}: InstructorDashboardProps) {
  const [staff, setStaff] = useState<OfferingStaffMember[]>(initialStaff);
  const [isAddTaModalOpen, setIsAddTaModalOpen] = useState(false);
  const [addTaModalKey, setAddTaModalKey] = useState(0);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [removingStaffMemberId, setRemovingStaffMemberId] = useState<
    string | null
  >(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const instructorCount = useMemo(
    () => staff.filter((member) => member.role === "Instructor").length,
    [staff],
  );

  const handleAddStaffMember = async (input: {
    utorid: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  }) => {
    setIsAddingStaff(true);
    setAddError(null);

    const result = await addOfferingTaAction({
      offeringPublicId,
      ...input,
    });

    setIsAddingStaff(false);

    if (!result.ok) {
      setAddError(result.error);
      return false;
    }

    if (result.staffMember) {
      setStaff((currentStaff) => [
        result.staffMember!,
        ...currentStaff.filter(
          (member) =>
            member.utorid.toLowerCase() !==
            result.staffMember!.utorid.toLowerCase(),
        ),
      ]);
    }

    setAddError(null);
    return true;
  };

  const handleBulkAddStaffMembers = async (text: string) => {
    setIsAddingStaff(true);
    setAddError(null);

    const result = await bulkAddOfferingTasAction({
      offeringPublicId,
      text,
    });

    setIsAddingStaff(false);

    if (!result.ok) {
      setAddError(result.error);
      return false;
    }

    setStaff(result.staff);
    setAddError(null);
    return true;
  };

  const handleRemoveStaffMember = async (staffMemberId: string) => {
    setRemovingStaffMemberId(staffMemberId);
    setActionError(null);

    const result = await removeOfferingTaAction({
      offeringPublicId,
      userPublicId: staffMemberId,
    });

    setRemovingStaffMemberId(null);

    if (!result.ok) {
      setActionError(result.error);
      return;
    }

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

        <main className="mt-6 space-y-8">
          <section className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-[#071f41] sm:text-[2.1rem]">
                Staff Management
              </h1>
              <p className="text-base text-slate-600">{courseLabel}</p>
            </div>

            {canEdit ? (
              <button
                type="button"
                onClick={() => {
                  setAddError(null);
                  setAddTaModalKey((key) => key + 1);
                  setIsAddTaModalOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#071f41] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(7,31,65,0.7)] transition hover:bg-[#0f2942]"
              >
                <UserPlus className="h-4 w-4" />
                Add TA
              </button>
            ) : null}
          </section>

          {actionError ? (
            <p className="rounded-2xl border border-[#fecdd3] bg-[#fff1f2] px-4 py-3 text-sm text-[#9f1239]">
              {actionError}
            </p>
          ) : null}

          <section className="grid gap-4 md:grid-cols-3">
            <StatCard label="TOTAL STAFF" value={staff.length.toString()} />
            <StatCard
              label="INSTRUCTORS"
              value={instructorCount.toString().padStart(2, "0")}
              valueClassName="text-[#c8102e]"
            />
            <StatCard
              label="WEEKLY SLOTS"
              value={weeklySlotCount.toString()}
              valueClassName="text-[#8a5a17]"
            />
          </section>

          <StaffTable
            staff={staff}
            canEdit={canEdit}
            onRemoveStaffMember={handleRemoveStaffMember}
            removingStaffMemberId={removingStaffMemberId}
          />
        </main>
      </div>

      <AddTaModal
        key={addTaModalKey}
        isOpen={isAddTaModalOpen}
        onClose={() => {
          if (!isAddingStaff) {
            setIsAddTaModalOpen(false);
            setAddError(null);
          }
        }}
        onAddStaffMember={handleAddStaffMember}
        onBulkAddStaffMembers={handleBulkAddStaffMembers}
        isSubmitting={isAddingStaff}
        error={addError}
      />
    </div>
  );
}
