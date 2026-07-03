import { redirect } from "next/navigation";

/**
 * Build destination paths for old `?offering=` URLs.
 */
export function buildLegacyOfferingRedirectUrl(
  searchParams: { offering?: string; sessionId?: string },
  instructorSubPath: string,
): string | null {
  const offeringPublicId = searchParams.offering?.trim();
  if (!offeringPublicId) {
    return null;
  }

  const encodedOffering = encodeURIComponent(offeringPublicId);
  const base = `/course/${encodedOffering}${instructorSubPath}`;

  if (searchParams.sessionId?.trim()) {
    const params = new URLSearchParams({
      sessionId: searchParams.sessionId.trim(),
    });
    return `${base}?${params.toString()}`;
  }

  return base;
}

/**
 * Redirect old `?offering=` URLs to `/course/[offeringPublicId]…` paths.
 */
export function redirectLegacyOfferingRoute(
  searchParams: { offering?: string; sessionId?: string },
  instructorSubPath: string,
) {
  const destination = buildLegacyOfferingRedirectUrl(
    searchParams,
    instructorSubPath,
  );
  if (!destination) {
    redirect("/admin");
  }
  redirect(destination);
}
