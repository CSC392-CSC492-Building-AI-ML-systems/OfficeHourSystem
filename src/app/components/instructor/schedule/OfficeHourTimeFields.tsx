"use client";

import { useMemo } from "react";
import {
  buildOfficeHourEndOptions,
  buildOfficeHourStartOptions,
  pickDefaultEndTime,
} from "@/lib/scheduling/time";

const selectClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#071f41]";

interface OfficeHourTimeFieldsProps {
  startTime: string;
  endTime: string;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
}

export function OfficeHourTimeFields({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
}: OfficeHourTimeFieldsProps) {
  const startOptions = useMemo(() => buildOfficeHourStartOptions(), []);
  const endOptions = useMemo(
    () => buildOfficeHourEndOptions(startTime),
    [startTime],
  );

  const handleStartChange = (value: string) => {
    onStartTimeChange(value);
    onEndTimeChange(pickDefaultEndTime(value, endTime));
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-[#071f41]">
          Start Time
        </span>
        <select
          value={startTime}
          onChange={(event) => handleStartChange(event.target.value)}
          className={selectClassName}
        >
          {startOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-[#071f41]">
          End Time
        </span>
        <select
          value={endTime}
          onChange={(event) => onEndTimeChange(event.target.value)}
          className={selectClassName}
          disabled={endOptions.length === 0}
        >
          {endOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
