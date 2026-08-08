import { NextRequest, NextResponse } from "next/server";
import { unsealData } from "iron-session";

import type { SessionData } from "@/lib/session";
import { shouldRefreshSessionIdentity } from "@/lib/auth/sessionIdentity";

const PRIVATE_CACHE_CONTROL = "private, no-store, max-age=0, must-revalidate";

// ---------------------------------------------------------------------------
// Routes that do NOT require authentication
// ---------------------------------------------------------------------------

const PUBLIC_PATHS = [
  "/api/auth/session", // session bootstrap (creates the cookie)
  "/api/health", // health check
  "/api/cron/oh-reminders", // cron trigger — self-guards with CRON_SECRET
  "/", // home page
  "/login", // role picker (Shibboleth wiring comes later)
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

function preventPrivateCaching(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", PRIVATE_CACHE_CONTROL);
  return response;
}

function sessionBootstrapRedirect(request: NextRequest): NextResponse {
  const loginUrl = new URL("/api/auth/session", request.url);
  loginUrl.searchParams.set(
    "redirect",
    request.nextUrl.pathname + request.nextUrl.search,
  );
  return preventPrivateCaching(NextResponse.redirect(loginUrl));
}

function identityChangedResponse(): NextResponse {
  return new NextResponse("Authentication identity changed.", {
    status: 401,
    headers: { "Cache-Control": PRIVATE_CACHE_CONTROL },
  });
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const isProduction = process.env.NODE_ENV === "production";
  const shibbolethUtorid = request.headers.get("utorid")?.trim() || null;

  // Production requests must have a current Shibboleth identity. Never render
  // protected data based only on a potentially stale application cookie.
  if (isProduction && !shibbolethUtorid) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return identityChangedResponse();
    }
    return sessionBootstrapRedirect(request);
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

      if (session?.userId) {
        const identityChanged = shouldRefreshSessionIdentity(
          isProduction,
          shibbolethUtorid,
          session.utorid,
        );

        if (identityChanged) {
          if (request.method !== "GET" && request.method !== "HEAD") {
            return identityChangedResponse();
          }
          return sessionBootstrapRedirect(request);
        }

        return preventPrivateCaching(NextResponse.next());
      }
    } catch {
      // Tampered or expired cookie — fall through to redirect
    }
  }

  // No valid session → bootstrap one via /api/auth/session
  // The route reads the utorid header (prod) or DEV_UTORID env var (dev),
  // creates the session cookie, and redirects back here.
  return sessionBootstrapRedirect(request);
}

export const config = {
  // Run on all routes except Next.js internals
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
