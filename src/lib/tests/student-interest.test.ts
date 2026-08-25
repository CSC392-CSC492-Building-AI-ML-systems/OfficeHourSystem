import "dotenv/config";

import assert from "node:assert/strict";

import {
  getInterestedSessionsForStudent,
  type InterestedSessionsClient,
} from "@/lib/queries/student_interest/student-interest";

async function main() {
  const now = new Date("2026-08-20T16:00:00.000Z");
  let query: unknown;
  const client: InterestedSessionsClient = {
    officeHourInterest: {
      findMany: async (args) => {
        query = args;
        return [
          {
            session: {
              id: 7,
              publicId: "session-public-id",
              type: "DEBUGGING",
              title: "Help Centre",
              description: null,
              location: null,
              startsAt: new Date("2026-08-21T17:00:00.000Z"),
              endsAt: new Date("2026-08-21T18:00:00.000Z"),
              offering: {
                termCode: "20265",
                course: { code: "CSC209" },
              },
            },
          },
        ];
      },
    },
  };

  const sessions = await getInterestedSessionsForStudent(42, now, client);
  assert.deepEqual(sessions, [
    {
      sessionId: 7,
      sessionPublicId: "session-public-id",
      type: "DEBUGGING",
      courseLabel: "CSC209 · 20265",
      title: "Help Centre",
      description: null,
      location: "TBD",
      startsAt: "2026-08-21T17:00:00.000Z",
      endsAt: "2026-08-21T18:00:00.000Z",
    },
  ]);

  const where = (
    query as {
      where: {
        userId: number;
        session: {
          endsAt: unknown;
          status: { in: string[] };
          offering: { members: unknown };
        };
      };
    }
  ).where;
  assert.equal(where.userId, 42);
  assert.deepEqual(where.session.endsAt, { gt: now });
  assert.deepEqual(where.session.status.in, ["SCHEDULED", "DELAYED"]);
  assert.deepEqual(where.session.offering.members, {
    some: { userId: 42, role: "STUDENT" },
  });

  console.log("student-interest.test.ts: all assertions passed");
}

void main();
