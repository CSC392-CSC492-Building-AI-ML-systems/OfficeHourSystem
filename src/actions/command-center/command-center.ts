"use server";

import { revalidatePath } from "next/cache";

import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import {
  getCommandCenterPage,
  requireInstructorForInstanceOffering,
} from "@/lib/queries/commandCenter";
import {
  addTaMember,
  deactivateTaMember,
  type AddTaResult,
  type RemoveTaResult,
  type TaListItem,
} from "@/lib/queries/offeringMember";

export type CommandCenterPageResponse = {
  offering: {
    offeringPublicId: string;
    courseCode: string;
    termCode: string;
  };
  canManageTas: boolean;
  tas: TaListItem[];
};

async function requireSessionUserId(): Promise<number> {
  const session = await getRequestSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return parseSessionUserId(session);
}

function revalidateCommandCenterPath() {
  revalidatePath("/instructor");
}

export async function getCommandCenterPageAction(): Promise<CommandCenterPageResponse> {
  const userId = await requireSessionUserId();
  return getCommandCenterPage(userId);
}

export type AddTaActionInput = {
  utorid: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

export async function addTaAction(
  input: AddTaActionInput,
): Promise<AddTaResult> {
  const userId = await requireSessionUserId();
  const { offeringPublicId } =
    await requireInstructorForInstanceOffering(userId);

  const result = await addTaMember(
    {
      utorid: input.utorid,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
    },
    { publicId: offeringPublicId },
  );

  if (result.outcome !== "already_added") {
    revalidateCommandCenterPath();
  }

  return result;
}

export async function removeTaAction(
  userPublicId: string,
): Promise<RemoveTaResult> {
  const userId = await requireSessionUserId();
  const { offeringPublicId } =
    await requireInstructorForInstanceOffering(userId);

  const result = await deactivateTaMember(
    { publicId: userPublicId },
    { publicId: offeringPublicId },
  );

  if (result.outcome === "removed") {
    revalidateCommandCenterPath();
  }

  return result;
}
