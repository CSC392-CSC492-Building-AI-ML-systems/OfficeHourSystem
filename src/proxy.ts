import { NextRequest, NextResponse } from "next/server";
import { unsealData } from "iron-session";

import type { SessionData } from "@/lib/session";

// ---------------------------------------------------------------------------
// Routes that do NOT require authentication
// ---------------------------------------------------------------------------

const PUBLIC_PATHS = [
  "/api/auth/session", // session bootstrap (creates the cookie)
  "/api/health", // health check
  "/api/cron/oh-reminders", // cron trigger — self-guards with CRON_SECRET
  "/", // home page
];

const PUBLIC_PREFIXES = [
  "/_next/", // Next.js static assets
  "/favicon.ico",
];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  return false;
}

function normalizeUtorid(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase();
  return normalized || null;
}

/**
 * A normal session belongs to session.utorid. During impersonation that value
 * is the target user, while Shibboleth still identifies the real admin stored
 * in session.impersonator. Compare against that real identity  so impersonation
 * remains active without allowing a different Shibboleth account to reuse it.
 */
function sessionMatchesCurrentIdentity(
  session: SessionData,
  authenticatedUtorid: string | null,
): boolean {
  // Jacky :) Check whether the session owner matches the current authenticated identity.
  const sessionOwnerUtorid = session.impersonator?.utorid ?? session.utorid;
  const currentUtorid = normalizeUtorid(authenticatedUtorid);

  return (
    currentUtorid !== null &&
    normalizeUtorid(sessionOwnerUtorid) === currentUtorid
  );
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProduction = process.env.NODE_ENV === "production";
  // Use Shibboleth in production and DEV_UTORID for local identity simulation.
  const authenticatedUtorid = isProduction
    ? request.headers.get("utorid")
    : (process.env.DEV_UTORID ?? null);

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Check for a valid iron-session cookie
  const cookieValue = request.cookies.get("ohsystem_session")?.value;
  if (cookieValue) {
    try {
      const sessionSecret = process.env.SESSION_SECRET;
      if (!sessionSecret) {
        console.error(
          "[Middleware] SESSION_SECRET is not configured — authentication is broken.",
        );
        return new NextResponse(
          "Server misconfiguration: SESSION_SECRET is not set.",
          {
            status: 500,
          },
        );
      }

      const session = await unsealData<SessionData>(cookieValue, {
        password: sessionSecret,
      });

      // Apply the same identity check in production and local development.
      if (
        session?.userId &&
        sessionMatchesCurrentIdentity(session, authenticatedUtorid)
      ) {
        return NextResponse.next();
      }
    } catch {
      // Tampered or expired cookie — fall through to redirect
    }
  }

  // No valid or identity-matching session then bootstrap via /api/auth/session.
  // The route reads the utorid header (prod) or DEV_UTORID env var (dev),
  // creates the session cookie, and redirects back here.
  const loginUrl = new URL("/api/auth/session", request.url);
  loginUrl.searchParams.set("redirect", pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Run on all routes except Next.js internals
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
