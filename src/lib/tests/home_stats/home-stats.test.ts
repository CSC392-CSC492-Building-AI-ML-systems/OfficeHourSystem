import "dotenv/config";

import assert from "node:assert/strict";

import {
  buildStaffHomeStatsFilters,
  buildStudentHomeStatsFilters,
  getHomeHeroStatsForUser,
  getHomeStatsWindow,
  type HomeStatsClient,
} from "@/lib/queries/home_stats/home-stats";
import { getHomeHeroStatsService } from "@/services/home_stats/home-stats";
import type { SessionData } from "@/lib/session";

const NOW = new Date("2026-08-20T16:00:00.000Z");
const SESSION: SessionData = {
  userId: "42",
  utorid: "student1",
  firstName: "Student",
  lastName: "One",
  email: "student1@mail.utoronto.ca",
};

function fakeClient(
  user: Awaited<ReturnType<HomeStatsClient["user"]["findUnique"]>>,
  counts: [number, number, number],
): HomeStatsClient {
  return {
    user: { findUnique: async () => user },
    officeHourSession: { count: async () => counts[0] },
    officeHourInterest: { count: async () => counts[1] },
    officeHourAttendance: { count: async () => counts[2] },
  };
}

async function main() {
  const { end } = getHomeStatsWindow(NOW);
  assert.equal(end.toISOString(), "2026-09-03T16:00:00.000Z");

  const studentFilters = buildStudentHomeStatsFilters(42, NOW);
  assert.deepEqual(studentFilters.upcoming.startsAt, { gt: NOW, lte: end });
  assert.deepEqual(studentFilters.upcoming.status.in, ["SCHEDULED", "DELAYED"]);
  assert.deepEqual(studentFilters.interested.session.status.in, [
    "SCHEDULED",
    "DELAYED",
  ]);
  assert.deepEqual(studentFilters.interested.session.endsAt, { gt: NOW });
  assert.equal(studentFilters.waiting.status, "WAITING");

  const staffFilters = buildStaffHomeStatsFilters(42, NOW);
  assert.deepEqual(staffFilters.upcoming.hosts, { some: { userId: 42 } });
  assert.deepEqual(staffFilters.waiting.session.status.in, [
    "ACTIVE",
    "DELAYED",
  ]);
  assert.equal(staffFilters.waiting.status, "WAITING");

  const student = await getHomeHeroStatsForUser(
    42,
    false,
    fakeClient({ isInstructor: false, memberships: [] }, [7, 4, 2]),
    NOW,
  );
  assert.deepEqual(student, {
    kind: "student",
    upcomingSessions: 7,
    interestedSessions: 4,
    waitingQueues: 2,
  });

  const mixedRole = await getHomeHeroStatsForUser(
    42,
    false,
    fakeClient(
      { isInstructor: false, memberships: [{ role: "TA" }] },
      [3, 11, 5],
    ),
    NOW,
  );
  assert.deepEqual(mixedRole, {
    kind: "staff",
    upcomingHostedSessions: 3,
    interestPresses: 11,
    studentsWaiting: 5,
  });

  const adminWithNoHosts = await getHomeHeroStatsForUser(
    42,
    true,
    fakeClient({ isInstructor: false, memberships: [] }, [0, 0, 0]),
    NOW,
  );
  assert.deepEqual(adminWithNoHosts, {
    kind: "staff",
    upcomingHostedSessions: 0,
    interestPresses: 0,
    studentsWaiting: 0,
  });

  assert.equal(
    await getHomeHeroStatsForUser(42, false, fakeClient(null, [0, 0, 0])),
    null,
  );

  assert.deepEqual(
    await getHomeHeroStatsService({ getSession: async () => null }),
    { kind: "anonymous" },
  );
  assert.deepEqual(
    await getHomeHeroStatsService({
      getSession: async () => {
        throw new Error("expired or tampered cookie");
      },
    }),
    { kind: "anonymous" },
  );
  assert.deepEqual(
    await getHomeHeroStatsService({
      getSession: async () => ({ ...SESSION, userId: "not-a-number" }),
    }),
    { kind: "anonymous" },
  );
  assert.deepEqual(
    await getHomeHeroStatsService({
      getSession: async () => SESSION,
      loadStats: async () => null,
    }),
    { kind: "anonymous" },
  );
  assert.deepEqual(
    await (async () => {
      const originalError = console.error;
      console.error = () => undefined;
      try {
        return await getHomeHeroStatsService({
          getSession: async () => SESSION,
          loadStats: async () => {
            throw new Error("database unavailable");
          },
        });
      } finally {
        console.error = originalError;
      }
    })(),
    { kind: "unavailable" },
  );

  console.log("home-stats.test.ts: all assertions passed");
}

void main();
