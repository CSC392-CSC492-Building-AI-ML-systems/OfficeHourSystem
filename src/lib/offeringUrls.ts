/** Course-scoped route base, e.g. `/course/<id>`. */
export function courseBasePath(offeringPublicId: string): string {
  return `/course/${encodeURIComponent(offeringPublicId)}`;
}

/**
 * Prefix an instructor/student sub-path (e.g. `/instructor/my-queues`) with the
 * course-scoped base, preserving any existing query string on the sub-path.
 */
export function courseRouteHref(
  pathname: string,
  offeringPublicId: string,
  extra?: { sessionId?: string },
): string {
  const [base, existingQuery] = pathname.split("?", 2);
  const params = new URLSearchParams(existingQuery ?? "");
  if (extra?.sessionId) {
    params.set("sessionId", extra.sessionId);
  }
  const query = params.toString();
  const scoped = `${courseBasePath(offeringPublicId)}${base}`;
  return query ? `${scoped}?${query}` : scoped;
}

export function instructorDashboardHref(offeringPublicId: string): string {
  return courseRouteHref("/instructor", offeringPublicId);
}

/** Build course-scoped instructor route URLs with an optional `sessionId`. */
export function instructorRouteHref(
  pathname: string,
  offeringPublicId: string,
  extra?: { sessionId?: string },
): string {
  return courseRouteHref(pathname, offeringPublicId, extra);
}
