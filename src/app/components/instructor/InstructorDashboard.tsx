"use client";

import { useState } from "react";
import { Upload, UserPlus } from "lucide-react";
import {
  addOfferingTaAction,
  bulkAddOfferingTasAction,
  removeOfferingStudentAction,
  removeOfferingTaAction,
  reuploadOfferingClasslistAction,
} from "@/actions/instructor/staff";
import { Navbar } from "./Navbar";
import { AddTaModal } from "./cards/AddTaModal";
import { ReuploadClasslistModal } from "./cards/ReuploadClasslistModal";
import type {
  OfferingStaffMember,
  OfferingStudentMember,
} from "@/lib/queries/offeringMember";
import { StaffTable } from "./cards/StaffTable";
import { StudentTable } from "./cards/StudentTable";

type InstructorDashboardProps = {
  offeringPublicId: string;
  courseLabel: string;
  canEdit: boolean;
  initialStaff: OfferingStaffMember[];
  initialStudents: OfferingStudentMember[];
};

export default function InstructorDashboard({
  offeringPublicId,
  courseLabel,
  canEdit,
  initialStaff,
  initialStudents,
}: InstructorDashboardProps) {
  const [staff, setStaff] = useState<OfferingStaffMember[]>(initialStaff);
  const [students, setStudents] =
    useState<OfferingStudentMember[]>(initialStudents);
  const [isAddTaModalOpen, setIsAddTaModalOpen] = useState(false);
  const [addTaModalKey, setAddTaModalKey] = useState(0);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [removingStaffMemberId, setRemovingStaffMemberId] = useState<
    string | null
  >(null);
  const [removingStudentId, setRemovingStudentId] = useState<string | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [isReuploadModalOpen, setIsReuploadModalOpen] = useState(false);
  const [reuploadModalKey, setReuploadModalKey] = useState(0);
  const [isReuploading, setIsReuploading] = useState(false);
  const [reuploadError, setReuploadError] = useState<string | null>(null);

  const handleAddStaffMember = async (input: { utorid: string }) => {
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

  const handleRemoveStudent = async (studentId: string) => {
    setRemovingStudentId(studentId);
    setActionError(null);

    const result = await removeOfferingStudentAction({
      offeringPublicId,
      userPublicId: studentId,
    });

    setRemovingStudentId(null);

    if (!result.ok) {
      setActionError(result.error);
      return;
    }

    setStudents((current) =>
      current.filter((member) => member.id !== studentId),
    );
  };

  const handleReuploadClasslist = async (file: File) => {
    setIsReuploading(true);
    setReuploadError(null);

    const formData = new FormData();
    formData.set("file", file);

    const result = await reuploadOfferingClasslistAction(
      offeringPublicId,
      formData,
    );

    setIsReuploading(false);

    if (!result.ok) {
      setReuploadError(result.error);
      return false;
    }

    setStudents(result.students);
    setReuploadError(null);
    return true;
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
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    setReuploadError(null);
                    setReuploadModalKey((key) => key + 1);
                    setIsReuploadModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-[#071f41] transition hover:bg-slate-50"
                >
                  <Upload className="h-4 w-4" />
                  Reupload classlist
                </button>
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
              </div>
            ) : null}
          </section>

          {actionError ? (
            <p className="rounded-2xl border border-[#fecdd3] bg-[#fff1f2] px-4 py-3 text-sm text-[#9f1239]">
              {actionError}
            </p>
          ) : null}

          <StaffTable
            staff={staff}
            canEdit={canEdit}
            onRemoveStaffMember={handleRemoveStaffMember}
            removingStaffMemberId={removingStaffMemberId}
          />

          <StudentTable
            students={students}
            canEdit={canEdit}
            onRemoveStudent={handleRemoveStudent}
            removingStudentId={removingStudentId}
          />
        </main>
      </div>

      <ReuploadClasslistModal
        key={`reupload-${reuploadModalKey}`}
        isOpen={isReuploadModalOpen}
        courseLabel={courseLabel}
        onClose={() => {
          if (!isReuploading) {
            setIsReuploadModalOpen(false);
            setReuploadError(null);
          }
        }}
        onUpload={handleReuploadClasslist}
        isSubmitting={isReuploading}
        error={reuploadError}
      />

      <AddTaModal
        key={`add-ta-${addTaModalKey}`}
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
