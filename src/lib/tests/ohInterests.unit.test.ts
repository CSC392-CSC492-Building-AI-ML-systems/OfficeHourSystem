import "dotenv/config";

import assert from "node:assert/strict";

import { recordSessionInterest } from "@/lib/ohInterests";

type InterestClient = NonNullable<Parameters<typeof recordSessionInterest>[2]>;

function clientForRole(role: string) {
  let upserted = false;
  const client: InterestClient = {
    officeHourSession: {
      findUnique: async () => ({ id: 9, offeringId: 3 }),
    },
    offeringMember: {
      findUnique: async () => ({ id: 5, role }),
    },
    officeHourInterest: {
      upsert: async () => {
        upserted = true;
        return { id: 12 };
      },
      deleteMany: async () => ({ count: 0 }),
    },
  };
  return {
    client,
    wasUpserted: () => upserted,
  };
}

async function main() {
  const student = clientForRole("STUDENT");
  assert.deepEqual(await recordSessionInterest(42, 9, student.client), {
    interestId: 12,
    userId: 42,
    sessionId: 9,
  });
  assert.equal(student.wasUpserted(), true);

  const ta = clientForRole("TA");
  await assert.rejects(
    recordSessionInterest(42, 9, ta.client),
    /Only enrolled students/,
  );
  assert.equal(ta.wasUpserted(), false);

  console.log("ohInterests.unit.test.ts: all assertions passed");
}

void main();
