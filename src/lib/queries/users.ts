export type UserIdentifierMatch = {
  id: number;
  [key: string]: unknown;
};

type UserFindFirstArgs = {
  where: {
    OR: Array<{
      utorid?: string;
      email?: string;
      studentNumber?: string;
    }>;
  };
};

export type UserLookupClient<TUser = UserIdentifierMatch> = {
  user: {
    findFirst(args: UserFindFirstArgs): Promise<TUser | null>;
  };
};

export type UserBarcodeLookupClient<TUser = UserIdentifierMatch> = {
  user: {
    findFirst(args: {
      where: { barcodeNumber: string };
    }): Promise<TUser | null>;
  };
};

export function buildUserIdentifierWhere(identifier: string) {
  const keyword = identifier.trim();

  if (!keyword) {
    return null;
  }

  return {
    OR: [
      {
        utorid: keyword,
      },
      {
        email: keyword,
      },
      {
        studentNumber: keyword,
      },
    ],
  };
}

export async function find_user(identifier: string, client?: UserLookupClient) {
  return await findUserWithClient(identifier, client);
}

export async function findUserWithClient<TUser = UserIdentifierMatch>(
  identifier: string,
  client?: UserLookupClient<TUser>,
) {
  const where = buildUserIdentifierWhere(identifier);

  if (!where) {
    return null;
  }

  const db = (client ??
    (await import("../prisma")).prisma) as UserLookupClient<TUser>;

  return await db.user.findFirst({
    where,
  });
}

export const findUser = find_user;

/**
 * Find a user by their TCard barcode number.
 * Used for scanner-based office hour check-in.
 * Returns null if no user has this barcode registered.
 */
export async function findUserByBarcode<TUser = UserIdentifierMatch>(
  barcodeNumber: string,
  client?: UserBarcodeLookupClient<TUser>,
): Promise<TUser | null> {
  const barcode = barcodeNumber.trim();

  if (!barcode) {
    return null;
  }

  const db = (client ??
    (await import("../prisma")).prisma) as UserBarcodeLookupClient<TUser>;

  return await db.user.findFirst({
    where: { barcodeNumber: barcode },
  });
}
