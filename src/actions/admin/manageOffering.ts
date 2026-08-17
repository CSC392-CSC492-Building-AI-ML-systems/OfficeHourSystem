"use server";

import { revalidatePath } from "next/cache";

import { requireSessionUserId } from "@/lib/auth/getRequestSession";
import { userCanAccessAdmin } from "@/lib/auth/canAccessAdmin";
import { isAdmin } from "@/lib/adminList";
import { prisma } from "@/lib/prisma";
import {
  archiveOffering,
  deleteOffering,
  unarchiveOffering,
} from "@/lib/queries/admin/offerings";

export type OfferingManageResult = { ok: true } | { ok: false; error: string };

async function requireOfferingManager(offeringPublicId: string) {
  const userId = await requireSessionUserId();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { utorid: true },
  });

  if (!user) {
    throw new Error("Unauthorized");
  }

  const superAdmin = isAdmin(user.utorid);
  const canAccess = await userCanAccessAdmin(userId, user.utorid);
  if (!canAccess) {
    throw new Error("Unauthorized");
  }

  if (superAdmin) {
    return;
  }

  const offering = await prisma.courseOffering.findUnique({
    where: { publicId: offeringPublicId },
    select: {
      members: {
        where: { userId, role: "INSTRUCTOR" },
        select: { id: true },
      },
    },
  });

  if (!offering || offering.members.length === 0) {
    throw new Error(
      "Only course instructors or platform admins can manage this offering.",
    );
  }
}

export async function archiveOfferingAction(
  offeringPublicId: string,
): Promise<OfferingManageResult> {
  try {
    await requireOfferingManager(offeringPublicId);
    await archiveOffering(offeringPublicId);
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Failed to archive offering",
    };
  }
}

export async function unarchiveOfferingAction(
  offeringPublicId: string,
): Promise<OfferingManageResult> {
  try {
    await requireOfferingManager(offeringPublicId);
    await unarchiveOffering(offeringPublicId);
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Failed to unarchive offering",
    };
  }
}

export async function deleteOfferingAction(
  offeringPublicId: string,
): Promise<OfferingManageResult> {
  try {
    await requireOfferingManager(offeringPublicId);
    await deleteOffering(offeringPublicId);
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Failed to delete offering",
    };
  }
}
