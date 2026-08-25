import assert from "node:assert/strict";

import {
  getSessionInterestedStudents,
  type SessionInterestedStudentDto,
} from "@/lib/queries/officehourInterest";

type InterestedStudentsClient = {
  officeHourInterest: {
    findMany(args: unknown): Promise<
      Array<{
        createdAt: Date;
        user: {
          utorid: string;
          email: string | null;
          firstName: string | null;
          lastName: string | null;
        };
      }>
    >;
  };
};

async function main() {
  let query: unknown;
  const pressedAt = new Date("2026-08-23T21:35:00.000Z");
  const client: InterestedStudentsClient = {
    officeHourInterest: {
      findMany: async (args) => {
        query = args;
        return [
          {
            createdAt: pressedAt,
            user: {
              utorid: "smithj12",
              email: "smith@mail.utoronto.ca",
              firstName: "Jane",
              lastName: "Smith",
            },
          },
          {
            createdAt: pressedAt,
            user: {
              utorid: "doej34",
              email: null,
              firstName: null,
              lastName: null,
            },
          },
        ];
      },
    },
  };

  const students = await getSessionInterestedStudents(9, client as never);
  const expected: SessionInterestedStudentDto[] = [
    {
      name: "Jane Smith",
      utorid: "smithj12",
      email: "smith@mail.utoronto.ca",
      interestedAt: pressedAt.toISOString(),
    },
    {
      name: "doej34",
      utorid: "doej34",
      email: "",
      interestedAt: pressedAt.toISOString(),
    },
  ];

  assert.deepEqual(students, expected);
  assert.deepEqual((query as { where: { sessionId: number } }).where, {
    sessionId: 9,
  });
  assert.deepEqual((query as { orderBy: { createdAt: string } }).orderBy, {
    createdAt: "desc",
  });

  console.log("session-interested-students.test.ts: all assertions passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
