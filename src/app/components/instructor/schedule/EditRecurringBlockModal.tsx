"use client";

import { useState } from "react";
import { CalendarClock, Trash2, X } from "lucide-react";
import {
  snapOfficeHourEndTime,
  snapOfficeHourStartTime,
  validateOfficeHourTimes,
} from "@/lib/scheduling/time";
import { FieldCharLimitHint } from "./FieldCharLimitHint";
import { OfficeHourTimeFields } from "./OfficeHourTimeFields";
import {
  BLOCK_NAME_MAX_LENGTH,
  clampToMaxLength,
  LOCATION_MAX_LENGTH,
} from "./scheduleFieldLimits";
import type { RecurringRule } from "./types";
import { useModalOverlay } from "./useModalOverlay";

interface EditRecurringBlockModalProps {
  isOpen: boolean;
  block: RecurringRule | null;
  onClose: () => void;
  onSave: (input: {
    title: string;
    location: string;
    startTime: string;
    endTime: string;
  }) => Promise<void>;
  onDelete: () => Promise<void>;
  onError?: (message: string | null) => void;
}

export function EditRecurringBlockModal({
  isOpen,
  block,
  onClose,
  onSave,
  onDelete,
  onError,
}: EditRecurringBlockModalProps) {
  useModalOverlay(isOpen && block !== null, onClose);

  if (!isOpen || !block) {
    return null;
  }

  return (
    <EditRecurringBlockForm
      key={block.id}
      block={block}
      onClose={onClose}
      onSave={onSave}
      onDelete={onDelete}
      onError={onError}
    />
  );
}

function EditRecurringBlockForm({
  block,
  onClose,
  onSave,
  onDelete,
  onError,
}: {
  block: RecurringRule;
  onClose: () => void;
  onSave: EditRecurringBlockModalProps["onSave"];
  onDelete: EditRecurringBlockModalProps["onDelete"];
  onError?: EditRecurringBlockModalProps["onError"];
}) {
  const [title, setTitle] = useState(() =>
    clampToMaxLength(block.title, BLOCK_NAME_MAX_LENGTH),
  );
  const [location, setLocation] = useState(() =>
    clampToMaxLength(
      block.defaultLocation === "TBD" ? "" : block.defaultLocation,
      LOCATION_MAX_LENGTH,
    ),
  );
  const [startTime, setStartTime] = useState(() =>
    snapOfficeHourStartTime(block.startTime),
  );
  const [endTime, setEndTime] = useState(() =>
    snapOfficeHourEndTime(block.startTime, block.endTime),
  );
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const showError = (message: string) => {
    onError?.(message);
    onClose();
  };

  const handleSave = async () => {
    onError?.(null);

    const timeError = validateOfficeHourTimes(startTime, endTime);
    if (timeError) {
      showError(timeError);
      return;
    }

    setSubmitting(true);
    try {
      await onSave({
        title: title.trim() || block.title,
        location: location.trim(),
        startTime,
        endTime,
      });
    } catch (saveError) {
      showError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to update recurring block.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Delete this entire recurring block? All scheduled sessions from this rule will be cancelled.",
    );
    if (!confirmed) {
      return;
    }

    onError?.(null);
    setDeleting(true);
    try {
      await onDelete();
    } catch (deleteError) {
      showError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete recurring block.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#071f41]/55 px-4 py-8 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-[32px] border border-slate-200/80 bg-white shadow-[0_40px_120px_-50px_rgba(7,31,65,0.7)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-6 border-b border-slate-200 px-6 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef5ff] text-[#071f41]">
              <CalendarClock className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-[#071f41]">
                Edit Recurring Block
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Repeats: {block.repeats} ({block.validFrom} – {block.validUntil}
                ) (not editable)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close edit recurring block modal"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-[#071f41]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-6 sm:px-8">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#071f41]">
              Block Name
            </span>
            <input
              type="text"
              value={title}
              maxLength={BLOCK_NAME_MAX_LENGTH}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#071f41]"
            />
            <FieldCharLimitHint maxLength={BLOCK_NAME_MAX_LENGTH} />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#071f41]">
              Default Location
            </span>
            <input
              type="text"
              value={location}
              maxLength={LOCATION_MAX_LENGTH}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Room 402 or Zoom link"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#071f41]"
            />
            <FieldCharLimitHint maxLength={LOCATION_MAX_LENGTH} />
          </label>

          <OfficeHourTimeFields
            startTime={startTime}
            endTime={endTime}
            onStartTimeChange={setStartTime}
            onEndTimeChange={setEndTime}
          />

          <p className="text-xs leading-5 text-slate-500">
            Changes apply to the rule and all upcoming scheduled sessions in
            this block. Individual session overrides are not changed here.
          </p>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={submitting || deleting}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#c8102e] px-5 py-3 text-sm font-semibold text-[#c8102e] transition hover:bg-[#fff1f2] disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? "Deleting…" : "Delete Block"}
          </button>

          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting || deleting}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-[#071f41] transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={submitting || deleting}
              className="inline-flex items-center justify-center rounded-full bg-[#071f41] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0f2942] disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
