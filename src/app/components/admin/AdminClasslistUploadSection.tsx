"use client";

import { useRef, useState, useTransition, type DragEvent } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Upload,
  X,
} from "lucide-react";

import { uploadAdminClasslistAction } from "@/actions/admin/uploadClasslist";
import { CLASSLIST_CSV_HEADERS } from "@/lib/csv/parseCSV";
import { instructorDashboardHref } from "@/lib/offeringUrls";

type AdminClasslistUploadSectionProps = {
  onSuccess?: () => void;
};

export function AdminClasslistUploadSection({
  onSuccess,
}: AdminClasslistUploadSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [courseName, setCourseName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createdOfferingHref, setCreatedOfferingHref] = useState<string | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const resetSelection = () => {
    setSelectedFile(null);
    setShowConfirm(false);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const acceptFile = (file: File | undefined) => {
    if (!file) return;

    setError(null);
    setSuccess(null);
    setCreatedOfferingHref(null);
    setShowConfirm(false);

    const isCsv =
      file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv";

    if (!isCsv) {
      setError("Please choose a .csv file exported from the UofT classlist.");
      resetSelection();
      return;
    }

    setSelectedFile(file);
  };

  const handleImport = () => {
    if (!selectedFile || !courseName.trim()) return;

    setError(null);
    setSuccess(null);
    setCreatedOfferingHref(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("file", selectedFile);
      // Stored in CourseOffering.termCode (no schema change); used as display name.
      formData.set("termCode", courseName.trim());

      const result = await uploadAdminClasslistAction(formData);

      if (!result.ok) {
        setError(result.error);
        setShowConfirm(false);
        return;
      }

      const clearedNote =
        result.cleared > 0
          ? ` Replaced ${result.cleared} previously enrolled student${result.cleared === 1 ? "" : "s"}.`
          : "";

      setSuccess(
        `Created ${result.termCode} (${result.courseCode}) with ${result.imported} student${result.imported === 1 ? "" : "s"}.${clearedNote} You were added as an instructor.`,
      );
      setCreatedOfferingHref(instructorDashboardHref(result.offeringPublicId));
      resetSelection();
      onSuccess?.();
    });
  };

  const canSubmit = courseName.trim().length > 0 && selectedFile !== null;

  return (
    <section className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-[0_18px_50px_-30px_rgba(15,41,66,0.35)]">
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-lg font-semibold text-[#071f41]">
          Create course offering
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Upload a UofT classlist CSV to create the course and offering, import
          students, and add yourself as an instructor for that offering.
        </p>
      </div>

      <div className="space-y-5 px-6 py-5">
        <label className="block space-y-2 text-sm font-medium text-[#071f41]">
          <span>Course name</span>
          <input
            value={courseName}
            onChange={(event) => setCourseName(event.target.value)}
            placeholder="e.g. CSC492 Fall 2026"
            disabled={isPending}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#071f41] focus:bg-white disabled:opacity-60"
          />
          <p className="text-xs font-normal text-slate-500">
            A display name for this offering. Use something that distinguishes
            Fall vs Winter if needed. Course code still comes from the CSV.
          </p>
        </label>

        <div>
          <p className="text-sm font-medium text-[#071f41]">
            Required CSV columns
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {CLASSLIST_CSV_HEADERS.map((header) => (
              <span
                key={header}
                className="rounded-full border border-slate-200 bg-[#f8fafc] px-3 py-1 text-xs font-medium text-slate-600"
              >
                {header}
              </span>
            ))}
          </div>
        </div>

        <div
          onDragOver={(event: DragEvent<HTMLDivElement>) => {
            event.preventDefault();
            setIsDragActive(true);
          }}
          onDragLeave={(event: DragEvent<HTMLDivElement>) => {
            event.preventDefault();
            setIsDragActive(false);
          }}
          onDrop={(event: DragEvent<HTMLDivElement>) => {
            event.preventDefault();
            setIsDragActive(false);
            acceptFile(event.dataTransfer.files[0]);
          }}
          className={`rounded-[24px] border-2 border-dashed px-6 py-8 transition ${
            isDragActive
              ? "border-[#071f41] bg-[#eef4ff]"
              : "border-slate-200 bg-[#fbfdff] hover:border-slate-300"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            disabled={isPending}
            className="sr-only"
            onChange={(event) => acceptFile(event.target.files?.[0])}
          />

          <div className="flex flex-col items-center text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#eaf1ff] text-[#071f41]">
              <Upload className="h-6 w-6" />
            </div>
            <p className="mt-4 text-sm font-medium text-[#071f41]">
              Drag and drop your classlist CSV here
            </p>
            <p className="mt-1 text-sm text-slate-500">
              or choose a file from your computer
            </p>
            <button
              type="button"
              disabled={isPending}
              onClick={() => inputRef.current?.click()}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#071f41] transition hover:bg-slate-50 disabled:opacity-50"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Choose CSV file
            </button>
          </div>
        </div>

        {selectedFile ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[#071f41]">
                {selectedFile.name}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {(selectedFile.size / 1024).toFixed(1)} KB · {courseName || "—"}
              </p>
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={resetSelection}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <X className="h-4 w-4" />
              Remove
            </button>
          </div>
        ) : null}

        {showConfirm && selectedFile ? (
          <div className="rounded-2xl border border-[#fde68a] bg-[#fffbeb] px-4 py-4">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#b45309]" />
              <div className="space-y-3">
                <p className="text-sm text-[#a16207]">
                  This will create or update the course offering{" "}
                  <span className="font-semibold">{courseName}</span> and import
                  all students from the CSV. Re-importing replaces existing
                  student enrollments for that offering.
                </p>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setShowConfirm(false)}
                    className="rounded-full border border-[#fcd34d] bg-white px-4 py-2.5 text-sm font-semibold text-[#92400e]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleImport}
                    className="rounded-full bg-[#071f41] px-4 py-2.5 text-sm font-semibold text-white disabled:bg-slate-300"
                  >
                    {isPending ? "Importing..." : "Confirm import"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="rounded-2xl border border-[#fecdd3] bg-[#fff1f2] px-4 py-3 text-sm font-medium text-[#9f1239]">
            {error}
          </p>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#166534]">
            <p className="flex items-start gap-2 font-medium">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{success}</span>
            </p>
            {createdOfferingHref ? (
              <a
                href={createdOfferingHref}
                className="mt-3 inline-block text-sm font-semibold text-[#071f41] underline"
              >
                Open course dashboard →
              </a>
            ) : null}
          </div>
        ) : null}

        {selectedFile && !showConfirm ? (
          <div className="flex justify-end border-t border-slate-200 pt-5">
            <button
              type="button"
              disabled={!canSubmit || isPending}
              onClick={() => setShowConfirm(true)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#071f41] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(7,31,65,0.7)] transition hover:bg-[#0f2942] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Upload className="h-4 w-4" />
              Review import
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
