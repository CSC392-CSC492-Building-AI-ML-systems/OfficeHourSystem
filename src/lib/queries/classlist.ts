export type ClasslistRow = {
  Acad_act: string;
  Email: string;
  Surname: string;
  "Given Name": string;
  "Person ID": string;
  Current_sts?: string;
  UTORid: string;
};

export type ImportClasslistInput = {
  termCode: string;
  rows: ClasslistRow[];
};

export type ImportClasslistClient = {
  $transaction<T>(
    callback: (tx: ImportClasslistTransaction) => Promise<T>,
  ): Promise<T>;
};

export type ImportClasslistForOfferingInput = {
  offeringPublicId: string;
  rows: ClasslistRow[];
};

export type ImportClasslistTransaction = {
  course: {
    upsert(args: unknown): Promise<{ id: number }>;
  };
  courseOffering: {
    upsert(args: unknown): Promise<{ id: number; publicId: string }>;
  };
  offeringMember: {
    count(args: unknown): Promise<number>;
    deleteMany(args: unknown): Promise<{ count: number }>;
    findUnique(args: unknown): Promise<{ role: string } | null>;
    upsert(args: unknown): Promise<unknown>;
  };
  user: {
    findMany(args: unknown): Promise<Array<{ id: number }>>;
    create(args: unknown): Promise<{ id: number }>;
    update(args: unknown): Promise<{ id: number }>;
  };
};

function getStudentNumber(row: ClasslistRow) {
  return row["Person ID"].trim();
}

/** Remote DB classlist imports can exceed Prisma's default 5s interactive tx limit. */
const CLASSLIST_IMPORT_TX_TIMEOUT_MS = 60_000;

async function importClasslistInTransaction(
  tx: ImportClasslistTransaction,
  input: ImportClasslistInput,
) {
  const { termCode, rows } = input;

  if (!rows || rows.length === 0) {
    throw new Error("Cannot import an empty classlist");
  }

  // Assumption: one CSV is for one course offering.
  // So we get the course code from the first row.
  // e.g. "CSC398H5", "STA398H5"
  const courseCode = rows[0].Acad_act.trim();

  // 1. Find course based on course code.
  // If this course does not exist, create a new one.
  const course = await tx.course.upsert({
    where: {
      code: courseCode,
    },
    update: {},
    create: {
      code: courseCode,
    },
  });

  // 2. Find offering based on course id and term code.
  // In current schema, one course + one term = one offering.
  // If this offering does not exist, create a new one.
  const offering = await tx.courseOffering.upsert({
    where: {
      courseId_termCode: {
        courseId: course.id,
        termCode: termCode,
      },
    },
    update: {},
    create: {
      courseId: course.id,
      termCode: termCode,
    },
    select: {
      id: true,
      publicId: true,
    },
  });

  // 3. Check whether this offering already has imported students.
  // We only check STUDENT role here.
  // Do not delete TA or INSTRUCTOR members, because they are not from classlist CSV.
  const existingStudentCount = await tx.offeringMember.count({
    where: {
      offeringId: offering.id,
      role: "STUDENT",
    },
  });

  let cleared = 0;

  // 4. If this offering already has at least one student,
  // clear old student roster first.
  // This means the new CSV will replace the old CSV result.
  if (existingStudentCount > 0) {
    const deleteResult = await tx.offeringMember.deleteMany({
      where: {
        offeringId: offering.id,
        role: "STUDENT",
      },
    });

    cleared = deleteResult.count;
  }

  let imported = 0;

  // 5. Import students one row at a time.
  for (const row of rows) {
    const utorid = row.UTORid.trim();
    const studentNumber = getStudentNumber(row);

    // If a student does not have utorid,
    // this means the CSV data is not valid enough for import.
    // Throw error here so transaction can rollback everything.
    if (!utorid) {
      throw new Error("CSV contains a student row without UTORid");
    }

    // If a student does not have student number,
    // this means the CSV data is not valid enough for import.
    // Throw error here so transaction can rollback everything.
    if (!studentNumber) {
      throw new Error("CSV contains a student row without student number");
    }

    // 6. Find user based on utorid or student number.
    // If the user does not exist, create a new user.
    // If the user already exists, update name, email, and student number.
    const matchingUsers = await tx.user.findMany({
      where: {
        OR: [
          {
            utorid: utorid,
          },
          {
            studentNumber: studentNumber,
          },
        ],
      },
      select: {
        id: true,
      },
    });

    const matchingUserIds = new Set(matchingUsers.map((user) => user.id));

    if (matchingUserIds.size > 1) {
      throw new Error(
        "CSV row matches multiple existing users by UTORid and student number",
      );
    }

    const profileData = {
      ...(row.Email.trim() ? { email: row.Email.trim() } : {}),
      ...(row["Given Name"].trim()
        ? { firstName: row["Given Name"].trim() }
        : {}),
      ...(row.Surname.trim() ? { lastName: row.Surname.trim() } : {}),
    };

    const userData = {
      utorid,
      studentNumber,
      ...profileData,
    };

    const user =
      matchingUsers.length > 0
        ? await tx.user.update({
            where: {
              id: matchingUsers[0].id,
            },
            data: {
              studentNumber,
              ...profileData,
            },
          })
        : await tx.user.create({
            data: userData,
          });

    // 7. Add this user to this offering as a student.
    // Skip anyone who is already staff — a classlist row must not demote a TA
    // or instructor. Upsert still handles duplicate CSV rows for students.
    const existingMember = await tx.offeringMember.findUnique({
      where: {
        userId_offeringId: {
          userId: user.id,
          offeringId: offering.id,
        },
      },
      select: { role: true },
    });

    if (existingMember && existingMember.role !== "STUDENT") {
      continue;
    }

    await tx.offeringMember.upsert({
      where: {
        userId_offeringId: {
          userId: user.id,
          offeringId: offering.id,
        },
      },
      update: {
        role: "STUDENT",
      },
      create: {
        userId: user.id,
        offeringId: offering.id,
        role: "STUDENT",
      },
    });

    imported++;
  }

  // Return the import result to the caller.
  // This is useful for showing a success message on frontend.
  return {
    courseId: course.id,
    offeringId: offering.id,
    offeringPublicId: offering.publicId,
    cleared,
    imported,
  };
}

export async function importClasslistWithClient(
  input: ImportClasslistInput,
  client: ImportClasslistClient,
) {
  // Use transaction to make sure this import is all-or-nothing.
  // If any error happens inside, Prisma will rollback all database changes.
  return await client.$transaction((tx) =>
    importClasslistInTransaction(tx, input),
  );
}

export async function importClasslist(input: ImportClasslistInput) {
  const { prisma } = await import("../prisma");

  return prisma.$transaction(
    (tx) =>
      importClasslistInTransaction(
        tx as unknown as ImportClasslistTransaction,
        input,
      ),
    {
      timeout: CLASSLIST_IMPORT_TX_TIMEOUT_MS,
      maxWait: 10_000,
    },
  );
}

/**
 * Replace the student roster for an existing offering.
 * Course code in the CSV must match this offering's course.
 */
export async function importClasslistForOffering(
  input: ImportClasslistForOfferingInput,
) {
  const { prisma } = await import("../prisma");

  if (!input.rows || input.rows.length === 0) {
    throw new Error("Cannot import an empty classlist");
  }

  const offering = await prisma.courseOffering.findUnique({
    where: { publicId: input.offeringPublicId },
    select: {
      termCode: true,
      course: { select: { code: true } },
    },
  });

  if (!offering) {
    throw new Error("Course offering not found");
  }

  const csvCourseCode = input.rows[0].Acad_act.trim();
  if (csvCourseCode !== offering.course.code) {
    throw new Error(
      `This CSV is for ${csvCourseCode}, but this course is ${offering.course.code}.`,
    );
  }

  return importClasslist({
    termCode: offering.termCode,
    rows: input.rows,
  });
}
