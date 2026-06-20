/** Append `?offering=` to an instructor route, preserving any existing query string. */
export function withOfferingParam(
  pathname: string,
  offeringPublicId: string,
): string {
  const [base, existingQuery] = pathname.split("?", 2);
  const params = new URLSearchParams(existingQuery ?? "");
  params.set("offering", offeringPublicId);
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

export function instructorDashboardHref(offeringPublicId: string): string {
  return withOfferingParam("/instructor", offeringPublicId);
}

/** Build instructor route URLs with `offering` and optional `sessionId`. */
export function instructorRouteHref(
  pathname: string,
  offeringPublicId: string,
  extra?: { sessionId?: string },
): string {
  const [base, existingQuery] = pathname.split("?", 2);
  const params = new URLSearchParams(existingQuery ?? "");
  params.set("offering", offeringPublicId);
  if (extra?.sessionId) {
    params.set("sessionId", extra.sessionId);
  }
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}
