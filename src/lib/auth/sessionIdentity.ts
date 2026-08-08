export type AuthIdentity = {
  utorid: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
};

type ResolveAuthIdentityInput = {
  isProduction: boolean;
  shibboleth: AuthIdentity;
  development: AuthIdentity;
};

function clean(value: string | null): string | null {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

/** Production identities must come from Shibboleth, never DEV_* variables. */
export function resolveAuthIdentity({
  isProduction,
  shibboleth,
  development,
}: ResolveAuthIdentityInput): AuthIdentity {
  const source = isProduction ? shibboleth : development;
  const utorid = clean(source.utorid);

  return {
    utorid,
    firstName: clean(source.firstName) ?? (isProduction ? null : utorid),
    lastName: clean(source.lastName) ?? (isProduction ? null : utorid),
    email:
      clean(source.email) ??
      (!isProduction && utorid ? `${utorid}@mail.utoronto.ca` : null),
  };
}

/** Detect an account switch before rendering data from the previous session. */
export function shouldRefreshSessionIdentity(
  isProduction: boolean,
  shibbolethUtorid: string | null,
  sessionUtorid: string | null | undefined,
): boolean {
  if (!isProduction) return false;

  const currentIdentity = clean(shibbolethUtorid)?.toLowerCase();
  if (!currentIdentity) return false;

  return currentIdentity !== clean(sessionUtorid ?? null)?.toLowerCase();
}
