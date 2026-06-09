import { type CourseRole, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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

function buildStaffProfileUpdateData(
  ref: StaffMemberInput,
): Prisma.UserUpdateInput {
  const data: Prisma.UserUpdateInput = {};

  const email = ref.email?.trim();
  if (email) {
    data.email = email;
  }
  const firstName = ref.firstName?.trim();
  if (firstName) {
    data.firstName = firstName;
  }
  const lastName = ref.lastName?.trim();
  if (lastName) {
    data.lastName = lastName;
  }

  return data;
}

function buildStaffUserCreateData(
  utorid: string,
  ref: StaffMemberInput,
): Prisma.UserUncheckedCreateInput {
  const data = { utorid } as Prisma.UserUncheckedCreateInput;

  const email = ref.email?.trim();
  if (email) {
    data.email = email;
  }
  const firstName = ref.firstName?.trim();
  if (firstName) {
    data.firstName = firstName;
  }
  const lastName = ref.lastName?.trim();
  if (lastName) {
    data.lastName = lastName;
  }

  return data;
}

/** Convert an OfferingIdentifier into a Prisma where condition */
function offeringWhere(id: OfferingIdentifier) {
  if ("publicId" in id) return { publicId: id.publicId };
  return {
    course: { code: id.courseCode },
    termCode: id.termCode,
  };
}

// Get a user's role in a given offering

/**
 * Look up a user's role in a given course offering.
 *
 * Returns:
 *   - { role: CourseRole } if the user is a member of the offering
 *   - null if the user does not exist, the offering does not exist,
 *     or the user is not a member of the offering
 *
 * Example:
 *   const result = await getMemberRole(
 *     { utorid: "abcde123" },
 *     { courseCode: "CSC392H5", termCode: "2026F" }
 *   );
 *   // result?.role === "INSTRUCTOR"
 */
export async function getMemberRole(
  userIdentifier: UserIdentifier,
  offeringIdentifier: OfferingIdentifier,
): Promise<{ role: CourseRole } | null> {
  // 1. Find user
  const user = await prisma.user.findFirst({
    where: userWhere(userIdentifier),
    select: { id: true },
  });

  if (!user) return null;

  // 2. Find offering
  const offering = await prisma.courseOffering.findFirst({
    where: offeringWhere(offeringIdentifier),
    select: { id: true },
  });

  if (!offering) return null;

  // 3. Find membership record
  const member = await prisma.offeringMember.findUnique({
    where: {
      userId_offeringId: {
        userId: user.id,
        offeringId: offering.id,
      },
    },
    select: { role: true },
  });

  if (!member) return null;

  return { role: member.role };
}

//Add or update a staff member in an offering

/**
 * Add a user to an offering or update their role.
 *
 *
 * Add an INSTRUCTOR / TA role to an offering.
 * The STUDENT role can only be assigned via importClasslist() from a CSV file,
 * not through this function.
 *
 * Behaviour:
 *   - Offering does not exist -> throw error
 *   - Attempting to set STUDENT role -> throw error
 *   - UTORid reference with no existing user -> create a minimal User row
 *   - Non-UTORid reference with no existing user -> throw error
 *   - User not yet in the offering -> create a new OfferingMember
 *   - User already in the offering (including as STUDENT) -> update role
 *
 * Example:
 *   const result = await addOrUpdateStaffMember(
 *     { utorid: "tauser01" },
 *     { courseCode: "CSC392H5", termCode: "2026F" },
 *     "TA"
 *   );
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
  // Safety check: reject STUDENT role to prevent bypassing the classlist import process
  if (role === "STUDENT") {
    throw new Error(
      "STUDENT role cannot be assigned via this function. Use importClasslist() to import students from a classlist CSV.",
    );
  }

  // 1. Find or create user
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
      data: buildStaffUserCreateData(utorid, userRef),
      select: { id: true },
    });
  } else if (isStaffMemberInput(userRef)) {
    const profilePatch = buildStaffProfileUpdateData(userRef);
    if (Object.keys(profilePatch).length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: profilePatch,
      });
    }
  }

  // 2. Find offering (also throw if not found)
  const offering = await prisma.courseOffering.findFirst({
    where: offeringWhere(offeringIdentifier),
    select: { id: true },
  });

  if (!offering) {
    throw new Error("Course offering not found");
  }

  // 3. Check whether a membership record already exists (used to determine the created flag)
  const existing = await prisma.offeringMember.findUnique({
    where: {
      userId_offeringId: {
        userId: user.id,
        offeringId: offering.id,
      },
    },
    select: { id: true },
  });

  // 4. Upsert: create or update role
  const member = await prisma.offeringMember.upsert({
    where: {
      userId_offeringId: {
        userId: user.id,
        offeringId: offering.id,
      },
    },
    update: { role },
    create: {
      userId: user.id,
      offeringId: offering.id,
      role,
    },
    select: { role: true },
  });

  return {
    userId: user.id,
    offeringId: offering.id,
    role: member.role,
    created: existing === null,
  };
}
