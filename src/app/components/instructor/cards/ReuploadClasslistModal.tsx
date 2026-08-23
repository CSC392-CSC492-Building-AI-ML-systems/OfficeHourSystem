"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { FileSpreadsheet, Upload, X } from "lucide-react";

interface ReuploadClasslistModalProps {
  isOpen: boolean;
  courseLabel: string;
  onClose: () => void;
  onUpload: (file: File) => Promise<boolean>;
  isSubmitting: boolean;
  error: string | null;
}

export function ReuploadClasslistModal({
  isOpen,
  courseLabel,
  onClose,
  onUpload,
  isSubmitting,
  error,
}: ReuploadClasslistModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const resetSelection = () => {
    setSelectedFile(null);
    setFileError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const acceptFile = (file: File | undefined) => {
    if (!file) return;

    const isCsv =
      file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv";

    if (!isCsv) {
      setSelectedFile(null);
      setFileError(
        "Please choose a .csv file exported from the UofT classlist.",
      );
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      return;
    }

    setFileError(null);
    setSelectedFile(file);
  };

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose, isSubmitting]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async () => {
    if (!selectedFile || isSubmitting) {
      return;
    }

    const success = await onUpload(selectedFile);
    if (success) {
      resetSelection();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#071f41]/55 px-4 py-8 backdrop-blur-[2px]"
      onClick={() => {
        if (!isSubmitting) {
          onClose();
        }
      }}
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
              Reupload classlist
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Replace the student roster for {courseLabel}. Teaching staff are
              left unchanged.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close reupload classlist modal"
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-6">
          {fileError || error ? (
            <p className="rounded-2xl border border-[#fecdd3] bg-[#fff1f2] px-4 py-3 text-sm text-[#9f1239]">
              {fileError || error}
            </p>
          ) : null}

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
              disabled={isSubmitting}
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
                disabled={isSubmitting}
                onClick={() => inputRef.current?.click()}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#071f41] transition hover:bg-slate-50 disabled:opacity-50"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Choose CSV file
              </button>
            </div>
          </div>

          {selectedFile ? (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[#071f41]">
                  {selectedFile.name}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={resetSelection}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
              >
                <X className="h-4 w-4" />
                Remove
              </button>
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedFile || isSubmitting}
              onClick={() => void handleSubmit()}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#071f41] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(7,31,65,0.7)] transition hover:bg-[#0f2942] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              <Upload className="h-4 w-4" />
              {isSubmitting ? "Importing..." : "Upload classlist"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
