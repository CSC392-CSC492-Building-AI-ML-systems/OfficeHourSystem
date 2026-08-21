export const WAIT_STATS_MIN_SAMPLE = 10;

const TRIM_PERCENT = 0.05;
const Z_85 = 1.44; // 85% prediction interval

export type WaitStats = {
  avgMinutes: number;
  stdDev: number;
  margin85: number;
  sampleSize: number;
} | null;

type CompletedHelpRecord = {
  helpStartedAt: Date | null;
  helpEndedAt: Date | null;
  session: {
    offering: {
      courseId: number;
    };
  };
};

export type WaitStatsRecordSource = {
  listCompletedHelpRecords(courseIds: number[]): Promise<CompletedHelpRecord[]>;
};

const prismaWaitStatsSource: WaitStatsRecordSource = {
  async listCompletedHelpRecords(courseIds) {
    const { prisma } = await import("@/lib/prisma");

    return prisma.officeHourAttendanceRecord.findMany({
      where: {
        helpStartedAt: { not: null },
        helpEndedAt: { not: null },
        session: {
          offering: {
            courseId: { in: courseIds },
            // Deliberately do not filter archivedAt. Completed visits from an
            // archived offering remain useful history for the same course.
          },
        },
      },
      select: {
        helpStartedAt: true,
        helpEndedAt: true,
        session: {
          select: {
            offering: {
              select: { courseId: true },
            },
          },
        },
      },
    });
  },
};

export function calculateWaitStats(durations: number[]): WaitStats {
  const validDurations = durations.filter(
    (duration) => Number.isFinite(duration) && duration > 0,
  );

  if (validDurations.length < WAIT_STATS_MIN_SAMPLE) return null;

  const sorted = [...validDurations].sort((a, b) => a - b);
  const cut = Math.floor(sorted.length * TRIM_PERCENT);
  const trimmed = sorted.slice(cut, sorted.length - cut);

  if (trimmed.length < WAIT_STATS_MIN_SAMPLE) return null;

  const mean = trimmed.reduce((sum, value) => sum + value, 0) / trimmed.length;
  const variance =
    trimmed.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    trimmed.length;
  const stdDev = Math.sqrt(variance);

  return {
    avgMinutes: Math.round(mean * 10) / 10,
    stdDev: Math.round(stdDev * 10) / 10,
    margin85: Math.round(stdDev * Z_85 * 10) / 10,
    sampleSize: validDurations.length,
  };
}

/**
 * Return prediction statistics for each course. A course's records span all of
 * its offerings, including archived ones, so archiving a term cannot remove
 * its completed visits from future queue estimates.
 */
export async function getWaitStatsForCourses(
  courseIds: number[],
  source: WaitStatsRecordSource = prismaWaitStatsSource,
): Promise<Map<number, WaitStats>> {
  const uniqueCourseIds = [...new Set(courseIds)];
  const statsByCourseId = new Map<number, WaitStats>();

  if (uniqueCourseIds.length === 0) return statsByCourseId;

  const durationsByCourseId = new Map<number, number[]>(
    uniqueCourseIds.map((courseId) => [courseId, []]),
  );
  const records = await source.listCompletedHelpRecords(uniqueCourseIds);

  for (const record of records) {
    if (!record.helpStartedAt || !record.helpEndedAt) continue;

    const durationMinutes =
      (record.helpEndedAt.getTime() - record.helpStartedAt.getTime()) / 60_000;
    const durations = durationsByCourseId.get(record.session.offering.courseId);

    if (durations && Number.isFinite(durationMinutes) && durationMinutes > 0) {
      durations.push(durationMinutes);
    }
  }

  for (const courseId of uniqueCourseIds) {
    statsByCourseId.set(
      courseId,
      calculateWaitStats(durationsByCourseId.get(courseId) ?? []),
    );
  }

  return statsByCourseId;
}
