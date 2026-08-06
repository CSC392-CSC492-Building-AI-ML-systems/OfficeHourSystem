import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { getSessionOptions, type SessionData } from "@/lib/session";

// ---------------------------------------------------------------------------
// GET /api/auth/session
//
// Establishes an iron-session cookie for the authenticated user.
//
// Production: reads `utorid` (and optionally `mail`, `cn`) from headers
//             injected by Apache + mod_shib after a successful Shibboleth
//             SAML exchange.
//
// Development: reads DEV_UTORID (and optional DEV_EMAIL, DEV_NAME) from
//              environment variables so developers can work without Apache.
//
// After upserting the user in Postgres the route writes a sealed session
// cookie and redirects to the URL supplied in the `redirect` query param
// (defaults to "/").
// ---------------------------------------------------------------------------

function buildUserProfileUpdateData(profile: {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}): Prisma.UserUpdateInput {
  const data: Prisma.UserUpdateInput = {};

  if (profile.firstName) {
    data.firstName = profile.firstName;
  }
  if (profile.lastName) {
    data.lastName = profile.lastName;
  }
  if (profile.email) {
    data.email = profile.email;
  }

  return data;
}

function buildUserCreateData(
  utorid: string,
  profile: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  },
): Prisma.UserUncheckedCreateInput {
  const data = { utorid } as Prisma.UserUncheckedCreateInput;

  if (profile.firstName) {
    data.firstName = profile.firstName;
  }
  if (profile.lastName) {
    data.lastName = profile.lastName;
  }
  if (profile.email) {
    data.email = profile.email;
  }

  return data;
}

export async function GET(request: NextRequest) {
  const isProd = process.env.NODE_ENV === "production";

  // ------------------------------------------------------------------
  // 1. Resolve identity from Shibboleth headers or dev env vars
  // ------------------------------------------------------------------
  let utorid: string | null = null;
  let firstName: string | null = null;
  let lastName: string | null = null;
  let email: string | null = null;

  for (const [key, value] of request.headers.entries()) {
    console.log(`${key}: ${value}`);
  }

  if (isProd) {
    // Apache + mod_shib injects these headers on proxied requests. Next.js
    // is only reachable via Apache on localhost (see docker-compose / Apache config).
    utorid = request.headers.get("utorid");
    firstName = request.headers.get("givenName");
    lastName = request.headers.get("surname");
    email = request.headers.get("mail") ?? request.headers.get("email");
  }

  if (!isProd || !utorid) {
    // Dev mode or local Docker without Shibboleth — fall back to DEV_UTORID.
    utorid = utorid ?? process.env.DEV_UTORID ?? null;
    firstName = firstName ?? process.env.DEV_FIRSTNAME ?? utorid;
    lastName = lastName ?? process.env.DEV_LASTNAME ?? utorid;
    email = email ?? process.env.DEV_EMAIL ?? `${utorid}@mail.utoronto.ca`;
  }

  if (!utorid) {
    return NextResponse.json(
      {
        error: isProd
          ? "Shibboleth authentication required. Access this application through the protected URL."
          : "DEV_UTORID is not set. Add it to your .env file to simulate a logged-in user.",
      },
      { status: 401 },
    );
  }

  // ------------------------------------------------------------------
  // 2. Upsert user in Postgres (profile fields only; isInstructor is managed
  //    separately via /admin or other instructor-management flows).
  // ------------------------------------------------------------------
  const profile = { firstName, lastName, email };

  const user = await prisma.user.upsert({
    where: { utorid },
    update: buildUserProfileUpdateData(profile),
    create: buildUserCreateData(utorid, profile),
  });

  // ------------------------------------------------------------------
  // 3. Write the iron-session cookie
  // ------------------------------------------------------------------
  const session = await getIronSession<SessionData>(
    await cookies(),
    getSessionOptions(),
  );
  session.userId = user.id.toString();
  session.utorid = user.utorid;
  session.email = user.email ?? "";
  session.firstName = user.firstName ?? "";
  session.lastName = user.lastName ?? "";
  await session.save();

  // ------------------------------------------------------------------
  // 4. Redirect to the original destination (default: "/")
  // ------------------------------------------------------------------
  const redirectTo = request.nextUrl.searchParams.get("redirect") ?? "/";
  // Guard against open redirects — only allow relative paths on this origin.
  // Reject protocol-relative URLs like //evil.com which start with "/" but redirect off-site.
  const safeRedirect =
    redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/";

  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "localhost";
  const origin = `${proto}://${host}`;

  return NextResponse.redirect(new URL(safeRedirect, origin));
}
