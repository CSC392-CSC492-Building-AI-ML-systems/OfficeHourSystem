import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

import { prisma } from "@/lib/prisma";

const STATS_PATH = resolve(process.cwd(), "data/wait-stats.json");
const MIN_SAMPLE = 10;
const TRIM_PERCENT = 0.05;
const Z_85 = 1.44; // 85% prediction interval

export type WaitStats = {
  computedAt: string;
  avgMinutes: number;
  stdDev: number;
  margin85: number;
  sampleSize: number;
} | null;

function readStats(): WaitStats {
  try {
    const raw = readFileSync(STATS_PATH, "utf-8");
    return JSON.parse(raw) as WaitStats;
  } catch {
    return null;
  }
}

function writeStats(stats: NonNullable<WaitStats>) {
  mkdirSync(resolve(process.cwd(), "data"), { recursive: true });
  writeFileSync(STATS_PATH, JSON.stringify(stats, null, 2), "utf-8");
}

function trimmedMeanAndSD(
  values: number[],
): { mean: number; sd: number } | null {
  if (values.length < MIN_SAMPLE) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const cut = Math.floor(sorted.length * TRIM_PERCENT);
  const trimmed = sorted.slice(cut, sorted.length - cut);

  if (trimmed.length < MIN_SAMPLE) return null;

  const mean = trimmed.reduce((s, v) => s + v, 0) / trimmed.length;
  const variance =
    trimmed.reduce((s, v) => s + (v - mean) ** 2, 0) / trimmed.length;
  return { mean, sd: Math.sqrt(variance) };
}

export async function recomputeWaitStats(): Promise<void> {
  const records = await prisma.officeHourAttendanceRecord.findMany({
    where: {
      helpStartedAt: { not: null },
      helpEndedAt: { not: null },
    },
    select: { helpStartedAt: true, helpEndedAt: true },
  });

  const durations = records
    .map(
      (r) => (r.helpEndedAt!.getTime() - r.helpStartedAt!.getTime()) / 60_000,
    )
    .filter((d) => d > 0);

  const result = trimmedMeanAndSD(durations);
  if (!result) return;

  writeStats({
    computedAt: new Date().toISOString(),
    avgMinutes: Math.round(result.mean * 10) / 10,
    stdDev: Math.round(result.sd * 10) / 10,
    margin85: Math.round(result.sd * Z_85 * 10) / 10,
    sampleSize: durations.length,
  });
}

export function getWaitStats(): WaitStats {
  return readStats();
}
