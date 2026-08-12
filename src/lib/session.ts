import type { SessionOptions } from "iron-session";

// ---------------------------------------------------------------------------
// Session data shape stored inside the encrypted cookie
// ---------------------------------------------------------------------------

/** Real admin identity kept while the cookie acts as another user. */
export type ImpersonatorSnapshot = {
  userId: string;
  utorid: string;
  firstName: string;
  lastName: string;
  email: string;
};

export interface SessionData {
  userId: string;
  utorid: string;
  firstName: string;
  lastName: string;
  email: string;
  /** Present only while a super-admin is impersonating someone else. */
  impersonator?: ImpersonatorSnapshot;
}

// ---------------------------------------------------------------------------
// iron-session configuration (lazy so build can run without SESSION_SECRET)
// ---------------------------------------------------------------------------

const KNOWN_WEAK_SECRET = "replace-me-with-a-32-plus-char-random-string";

export function getSessionOptions(): SessionOptions {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET environment variable is not set. Generate one with: openssl rand -hex 32",
    );
  }
  if (secret === KNOWN_WEAK_SECRET || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET is insecure: it is either the example placeholder or shorter than 32 characters. " +
        "Generate a strong secret with: openssl rand -hex 32",
    );
  }
  return {
    password: secret,
    cookieName: "ohsystem_session",
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      // 8-hour session lifetime.
      maxAge: 60 * 60 * 8,
    },
  };
}
