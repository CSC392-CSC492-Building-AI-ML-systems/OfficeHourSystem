"use server";

import { cookies } from "next/headers";
import { getIronSession } from "iron-session";

import { requireAdminSession } from "@/lib/auth/requireAdmin";
import { isAdmin } from "@/lib/adminList";
import { prisma } from "@/lib/prisma";
import { getSessionOptions, type SessionData } from "@/lib/session";

export type ImpersonateResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string };

function writeIdentity(
  session: SessionData,
  user: {
    id: number | string;
    utorid: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  },
) {
  session.userId = typeof user.id === "string" ? user.id : user.id.toString();
  session.utorid = user.utorid;
  session.firstName = user.firstName ?? "";
  session.lastName = user.lastName ?? "";
  session.email = user.email ?? "";
}

/** Super-admin only: seal the cookie as another existing user. */
export async function impersonateUserAction(
  rawUtorid: string,
): Promise<ImpersonateResult> {
  try {
    const admin = await requireAdminSession();
    const session = await getIronSession<SessionData>(
      await cookies(),
      getSessionOptions(),
    );

    if (session.impersonator) {
      return {
        ok: false,
        error: "Already impersonating. Switch back first.",
      };
    }

    const utorid = rawUtorid.trim().toLowerCase();
    if (!utorid) {
      return { ok: false, error: "Enter a UTORid" };
    }
    if (utorid === admin.utorid.toLowerCase()) {
      return { ok: false, error: "You are already that user" };
    }

    const target = await prisma.user.findUnique({
      where: { utorid },
      select: {
        id: true,
        utorid: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });
    if (!target) {
      return { ok: false, error: "No user with that UTORid" };
    }

    session.impersonator = {
      userId: admin.userId,
      utorid: admin.utorid,
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
    };
    writeIdentity(session, target);
    await session.save();

    return { ok: true, redirectTo: "/course" };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Failed to impersonate user",
    };
  }
}

/** Restore the sealed cookie to the admin who started impersonation. */
export async function stopImpersonationAction(): Promise<ImpersonateResult> {
  try {
    const session = await getIronSession<SessionData>(
      await cookies(),
      getSessionOptions(),
    );

    const real = session.impersonator;
    if (!real) {
      return { ok: false, error: "Not impersonating" };
    }
    if (!isAdmin(real.utorid)) {
      return { ok: false, error: "Invalid impersonation state" };
    }

    writeIdentity(session, {
      id: real.userId,
      utorid: real.utorid,
      firstName: real.firstName,
      lastName: real.lastName,
      email: real.email,
    });
    delete session.impersonator;
    await session.save();

    return { ok: true, redirectTo: "/admin" };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to switch back to admin",
    };
  }
}
