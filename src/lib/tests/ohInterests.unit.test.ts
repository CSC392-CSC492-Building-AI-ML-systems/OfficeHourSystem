import "dotenv/config";

import assert from "node:assert/strict";

import {
  recordSessionInterest,
  removeSessionInterest,
} from "@/lib/ohInterests";

type InterestClient = NonNullable<Parameters<typeof recordSessionInterest>[2]>;

function clientForRole(role: string, deletedCount = 1) {
  let upserted = false;
  let deleteWhere: unknown;
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
      deleteMany: async (args) => {
        deleteWhere = args;
        return { count: deletedCount };
      },
    },
  };
  return {
    client,
    wasUpserted: () => upserted,
    deleteArgs: () => deleteWhere,
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

  const removal = clientForRole("STUDENT");
  assert.deepEqual(await removeSessionInterest(42, 9, removal.client), {
    removed: true,
    userId: 42,
    sessionId: 9,
  });
  assert.deepEqual(removal.deleteArgs(), {
    where: { userId: 42, sessionId: 9 },
  });

  const repeatedRemoval = clientForRole("STUDENT", 0);
  assert.deepEqual(await removeSessionInterest(42, 9, repeatedRemoval.client), {
    removed: false,
    userId: 42,
    sessionId: 9,
  });

  console.log("ohInterests.unit.test.ts: all assertions passed");
}

void main();
