import { type CourseRole, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ACTIVE_OFFERING_MEMBER_STATUS,
  INACTIVE_OFFERING_MEMBER_STATUS,
  offeringMemberRoleStatusSelect,
  type OfferingMemberStatus,
} from "@/lib/queries/offeringMemberConstants";
/**
 * User identifier: one of four options.
 *   utorid e.g. "abcede12"
 *   email e.g. "xxx@mail.utoronto.ca"
 *   studentNumber e.g. "1011662167"
 *   publicId cuid from the User table (public id see schema)
 */
export type UserIdentifier =
  | { utorid: string }
  | { email: string }
  | { studentNumber: string }
  | { publicId: string };

/** Optional profile fields when registering staff by UTORid only. */
export type StaffMemberInput = {
  utorid: string;
  email?: string;
  firstName?: string;
  lastName?: string;
};

export type StaffUserRef = UserIdentifier | StaffMemberInput;

/**
 * Offering identifier: one of two options.
 *   publicId cuid from the CourseOffering table
 *   courseCode + termCode — e.g. { courseCode: "CSC392H5", termCode: "2026F" }
 */
export type OfferingIdentifier =
  | { publicId: string }
  | { courseCode: string; termCode: string };

export type TaListItem = {
  userPublicId: string;
  utorid: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
};

export type AddTaResult =
  | { outcome: "created" | "reactivated" | "already_added" }
  | { outcome: "blocked"; reason: "instructor" | "student" };

export type RemoveTaResult = { outcome: "removed" } | { outcome: "not_found" };

const ACTIVE_STATUS = ACTIVE_OFFERING_MEMBER_STATUS;

type ActiveMembershipFields = {
  role: CourseRole;
  status: OfferingMemberStatus;
};

type ActiveTaMember = Prisma.OfferingMemberGetPayload<{
  include: {
    user: {
      select: {
        publicId: true;
        utorid: true;
        firstName: true;
        lastName: true;
        email: true;
      };
    };
  };
}>;

function activeTeachingStaffWhere(
  userId: number,
): Prisma.OfferingMemberWhereInput {
  return {
    userId,
    role: { in: ["INSTRUCTOR", "TA"] },
    status: ACTIVE_STATUS,
  } as Prisma.OfferingMemberWhereInput;
}

function activeTaWhere(offeringId: number): Prisma.OfferingMemberWhereInput {
  return {
    offeringId,
    role: "TA",
    status: ACTIVE_STATUS,
  } as Prisma.OfferingMemberWhereInput;
}

export type ActiveTeachingMembership = Prisma.OfferingMemberGetPayload<{
  include: {
    offering: {
      include: { course: true };
    };
  };
}>;

function normalizeUtorid(utorid: string) {
  return utorid.trim().toLowerCase();
}

function isStaffMemberInput(ref: StaffUserRef): ref is StaffMemberInput {
  return "utorid" in ref;
}

/** Convert a staff/user reference into a Prisma where condition */
function userWhere(id: StaffUserRef) {
  if ("utorid" in id) return { utorid: normalizeUtorid(id.utorid) };
  if ("email" in id) return { email: id.email };
  if ("studentNumber" in id) return { studentNumber: id.studentNumber };
  return { publicId: id.publicId };
}

function buildOptionalProfileData(ref: StaffMemberInput) {
  return {
    ...(ref.email?.trim() ? { email: ref.email.trim() } : {}),
    ...(ref.firstName?.trim() ? { firstName: ref.firstName.trim() } : {}),
    ...(ref.lastName?.trim() ? { lastName: ref.lastName.trim() } : {}),
  };
}

/** Convert an OfferingIdentifier into a Prisma where condition */
function offeringWhere(id: OfferingIdentifier) {
  if ("publicId" in id) return { publicId: id.publicId };
  return {
    course: { code: id.courseCode },
    termCode: id.termCode,
  };
}

/**
 * Resolve the single course offering for this deployment.
 * Each OHMS instance is scoped to one course offering.
 */
export async function getInstanceOffering() {
  const offering = await prisma.courseOffering.findFirst({
    orderBy: { id: "asc" },
    select: {
      id: true,
      publicId: true,
      termCode: true,
      course: { select: { code: true } },
    },
  });

  if (!offering) {
    throw new Error("Course offering not found");
  }

  return offering;
}

/**
 * Look up an active membership for a user in an offering.
 * Returns null when the user is inactive or not enrolled.
 */
export async function getActiveOfferingMembership(
  userId: number,
  offeringId: number,
): Promise<ActiveMembershipFields | null> {
  const member = (await prisma.offeringMember.findUnique({
    where: {
      userId_offeringId: { userId, offeringId },
    },
    select: offeringMemberRoleStatusSelect,
  })) as ActiveMembershipFields | null;

  if (!member || member.status !== ACTIVE_STATUS) {
    return null;
  }

  return member;
}

/** Offering IDs where the user is an active instructor or TA. */
export async function getActiveTeachingOfferingIds(
  userId: number,
): Promise<number[]> {
  const memberships = await prisma.offeringMember.findMany({
    where: activeTeachingStaffWhere(userId),
    select: { offeringId: true },
  });

  return memberships.map((membership) => membership.offeringId);
}

/** Whether the user belongs to any offering as an active instructor or TA. */
export async function hasActiveTeachingMembership(
  userId: number,
): Promise<boolean> {
  const membership = await prisma.offeringMember.findFirst({
    where: activeTeachingStaffWhere(userId),
    select: { id: true },
  });

  return membership !== null;
}

/** Active instructor/TA memberships with offering details for schedule navigation. */
export async function listActiveTeachingMemberships(
  userId: number,
): Promise<ActiveTeachingMembership[]> {
  return prisma.offeringMember.findMany({
    where: activeTeachingStaffWhere(userId),
    include: {
      offering: {
        include: { course: true },
      },
    },
    orderBy: { offering: { termCode: "desc" } },
  }) as Promise<ActiveTeachingMembership[]>;
}

/**
 * Look up a user's role in a given course offering.
 * Only active memberships are returned.
 */
export async function getMemberRole(
  userIdentifier: UserIdentifier,
  offeringIdentifier: OfferingIdentifier,
): Promise<{ role: CourseRole } | null> {
  const user = await prisma.user.findFirst({
    where: userWhere(userIdentifier),
    select: { id: true },
  });

  if (!user) return null;

  const offering = await prisma.courseOffering.findFirst({
    where: offeringWhere(offeringIdentifier),
    select: { id: true },
  });

  if (!offering) return null;

  const member = await getActiveOfferingMembership(user.id, offering.id);
  if (!member) return null;

  return { role: member.role };
}

/**
 * Add an INSTRUCTOR / TA role to an offering.
 * The STUDENT role can only be assigned via importClasslist().
 */
export async function addOrUpdateStaffMember(
  userRef: StaffUserRef,
  offeringIdentifier: OfferingIdentifier,
  role: CourseRole,
): Promise<{
  userId: number;
  offeringId: number;
  role: CourseRole;
  created: boolean;
}> {
  if (role === "STUDENT") {
    throw new Error(
      "STUDENT role cannot be assigned via this function. Use importClasslist() to import students from a classlist CSV.",
    );
  }

  let user = await prisma.user.findFirst({
    where: userWhere(userRef),
    select: { id: true },
  });

  if (!user) {
    if (!isStaffMemberInput(userRef)) {
      throw new Error("User not found");
    }

    const utorid = normalizeUtorid(userRef.utorid);
    if (!utorid) {
      throw new Error("UTORid is required");
    }

    user = await prisma.user.create({
      data: {
        utorid,
        ...buildOptionalProfileData(userRef),
      },
      select: { id: true },
    });
  } else if (isStaffMemberInput(userRef)) {
    const profilePatch = buildOptionalProfileData(userRef);
    if (Object.keys(profilePatch).length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: profilePatch,
      });
    }
  }

  const offering = await prisma.courseOffering.findFirst({
    where: offeringWhere(offeringIdentifier),
    select: { id: true },
  });

  if (!offering) {
    throw new Error("Course offering not found");
  }

  const existing = await prisma.offeringMember.findUnique({
    where: {
      userId_offeringId: {
        userId: user.id,
        offeringId: offering.id,
      },
    },
    select: { id: true },
  });

  const member = await prisma.offeringMember.upsert({
    where: {
      userId_offeringId: {
        userId: user.id,
        offeringId: offering.id,
      },
    },
    update: { role, status: ACTIVE_STATUS } as Prisma.OfferingMemberUpdateInput,
    create: {
      userId: user.id,
      offeringId: offering.id,
      role,
      status: ACTIVE_STATUS,
    } as Prisma.OfferingMemberUncheckedCreateInput,
    select: { role: true },
  });

  return {
    userId: user.id,
    offeringId: offering.id,
    role: member.role,
    created: existing === null,
  };
}

/**
 * Add a TA to the course offering.
 * Returns "already_added" when the user is already an active TA.
 */
export async function addTaMember(
  userRef: StaffMemberInput,
  offeringIdentifier: OfferingIdentifier,
): Promise<AddTaResult> {
  const utorid = normalizeUtorid(userRef.utorid);
  if (!utorid) {
    throw new Error("UTORid is required");
  }

  let user = await prisma.user.findFirst({
    where: { utorid },
    select: { id: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        utorid,
        ...buildOptionalProfileData(userRef),
      },
      select: { id: true },
    });
  } else {
    const profilePatch = buildOptionalProfileData(userRef);
    if (Object.keys(profilePatch).length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: profilePatch,
      });
    }
  }

  const offering = await prisma.courseOffering.findFirst({
    where: offeringWhere(offeringIdentifier),
    select: { id: true },
  });

  if (!offering) {
    throw new Error("Course offering not found");
  }

  const existing = (await prisma.offeringMember.findUnique({
    where: {
      userId_offeringId: {
        userId: user.id,
        offeringId: offering.id,
      },
    },
    select: offeringMemberRoleStatusSelect,
  })) as ActiveMembershipFields | null;

  if (existing?.role === "TA" && existing.status === ACTIVE_STATUS) {
    return { outcome: "already_added" };
  }

  if (existing?.role === "TA" && existing.status !== ACTIVE_STATUS) {
    await prisma.offeringMember.update({
      where: {
        userId_offeringId: {
          userId: user.id,
          offeringId: offering.id,
        },
      },
      data: { status: ACTIVE_STATUS } as Prisma.OfferingMemberUpdateInput,
    });
    return { outcome: "reactivated" };
  }

  if (existing?.role === "INSTRUCTOR") {
    return { outcome: "blocked", reason: "instructor" };
  }

  if (existing?.role === "STUDENT") {
    return { outcome: "blocked", reason: "student" };
  }

  await prisma.offeringMember.create({
    data: {
      userId: user.id,
      offeringId: offering.id,
      role: "TA",
      status: ACTIVE_STATUS,
    } as Prisma.OfferingMemberUncheckedCreateInput,
  });

  return { outcome: "created" };
}

/**
 * Deactivate an active TA in the offering. The membership row is kept for history.
 */
export async function deactivateTaMember(
  userIdentifier: UserIdentifier,
  offeringIdentifier: OfferingIdentifier,
): Promise<RemoveTaResult> {
  const user = await prisma.user.findFirst({
    where: userWhere(userIdentifier),
    select: { id: true },
  });

  if (!user) {
    return { outcome: "not_found" };
  }

  const offering = await prisma.courseOffering.findFirst({
    where: offeringWhere(offeringIdentifier),
    select: { id: true },
  });

  if (!offering) {
    throw new Error("Course offering not found");
  }

  const existing = (await prisma.offeringMember.findUnique({
    where: {
      userId_offeringId: {
        userId: user.id,
        offeringId: offering.id,
      },
    },
    select: offeringMemberRoleStatusSelect,
  })) as ActiveMembershipFields | null;

  if (
    !existing ||
    existing.role !== "TA" ||
    existing.status !== ACTIVE_STATUS
  ) {
    return { outcome: "not_found" };
  }

  await prisma.offeringMember.update({
    where: {
      userId_offeringId: {
        userId: user.id,
        offeringId: offering.id,
      },
    },
    data: {
      status: INACTIVE_OFFERING_MEMBER_STATUS,
    } as Prisma.OfferingMemberUpdateInput,
  });

  return { outcome: "removed" };
}

/** List active TAs for an offering. */
export async function listActiveTas(
  offeringIdentifier: OfferingIdentifier,
): Promise<TaListItem[]> {
  const offering = await prisma.courseOffering.findFirst({
    where: offeringWhere(offeringIdentifier),
    select: { id: true },
  });

  if (!offering) {
    throw new Error("Course offering not found");
  }

  const members = (await prisma.offeringMember.findMany({
    where: activeTaWhere(offering.id),
    include: {
      user: {
        select: {
          publicId: true,
          utorid: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: [{ user: { lastName: "asc" } }, { user: { firstName: "asc" } }],
  })) as ActiveTaMember[];

  return members.map((member) => ({
    userPublicId: member.user.publicId,
    utorid: member.user.utorid,
    firstName: member.user.firstName,
    lastName: member.user.lastName,
    email: member.user.email,
  }));
}
