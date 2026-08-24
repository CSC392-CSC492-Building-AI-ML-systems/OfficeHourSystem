import {
  calculateWaitStats,
  getWaitStatsForCourses,
  WAIT_STATS_MIN_SAMPLE,
  type WaitStatsRecordSource,
} from "../waitStats";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function completedRecord(courseId: number, durationMinutes: number) {
  const helpStartedAt = new Date("2026-01-01T12:00:00.000Z");
  return {
    helpStartedAt,
    helpEndedAt: new Date(helpStartedAt.getTime() + durationMinutes * 60_000),
    session: { offering: { courseId } },
  };
}

async function main() {
  assert(
    calculateWaitStats(Array(WAIT_STATS_MIN_SAMPLE - 1).fill(8)) === null,
    "prediction must remain unavailable below the minimum sample size",
  );

  const exactMinimum = calculateWaitStats(Array(WAIT_STATS_MIN_SAMPLE).fill(8));
  assert(exactMinimum?.avgMinutes === 8, "expected an 8 minute average");
  assert(
    exactMinimum.sampleSize === WAIT_STATS_MIN_SAMPLE,
    "sample size must count completed help records",
  );

  const courseOne = 101;
  const courseTwo = 202;
  const source: WaitStatsRecordSource = {
    async listCompletedHelpRecords(courseIds) {
      assert(
        courseIds.includes(courseOne) && courseIds.includes(courseTwo),
        "both active courses should be queried together",
      );
      return [
        ...Array.from({ length: WAIT_STATS_MIN_SAMPLE }, () =>
          completedRecord(courseOne, 6),
        ),
        ...Array.from({ length: WAIT_STATS_MIN_SAMPLE }, () =>
          completedRecord(courseOne, 10),
        ),
        ...Array.from({ length: WAIT_STATS_MIN_SAMPLE }, () =>
          completedRecord(courseTwo, 12),
        ),
      ];
    },
  };

  const stats = await getWaitStatsForCourses(
    [courseOne, courseTwo, courseOne],
    source,
  );
  assert(
    stats.get(courseOne)?.avgMinutes === 8,
    "records from multiple offerings of the same course should be combined",
  );
  assert(
    stats.get(courseOne)?.sampleSize === 20,
    "historical samples for the same course should be retained",
  );
  assert(
    stats.get(courseTwo)?.avgMinutes === 12,
    "courses must keep independent prediction averages",
  );

  console.log("waitStats tests passed");
}

void main();
