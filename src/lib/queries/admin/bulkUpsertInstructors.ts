import { prisma } from "@/lib/prisma";
import { parseAdminList } from "@/lib/adminList";

export type BulkUpsertInstructorsSuccess = {
  ok: true;
  created: number;
  updated: number;
  total: number;
};

export type BulkUpsertInstructorsFailure = {
  ok: false;
  error: string;
};

export type BulkUpsertInstructorsResult =
  | BulkUpsertInstructorsSuccess
  | BulkUpsertInstructorsFailure;

function toFailure(error: unknown): BulkUpsertInstructorsFailure {
  return {
    ok: false,
    error:
      error instanceof Error
        ? error.message
        : "Failed to bulk upsert instructors",
  };
}

/**
 * Parse admin-list text (one UTORid per line) and upsert each with `isInstructor: true`.
 */
export async function bulkUpsertInstructorsFromText(
  text: string,
): Promise<BulkUpsertInstructorsResult> {
  try {
    const utorids = parseAdminList(text);
    if (utorids.length === 0) {
      throw new Error("No UTORids provided");
    }

    let created = 0;
    let updated = 0;

    await prisma.$transaction(async (tx) => {
      for (const utorid of utorids) {
        const existing = await tx.user.findUnique({
          where: { utorid },
          select: { id: true },
        });

        await tx.user.upsert({
          where: { utorid },
          create: { utorid, isInstructor: true },
          update: { isInstructor: true },
        });

        if (existing) {
          updated += 1;
        } else {
          created += 1;
        }
      }
    });

    return {
      ok: true,
      created,
      updated,
      total: utorids.length,
    };
  } catch (error) {
    return toFailure(error);
  }
}
