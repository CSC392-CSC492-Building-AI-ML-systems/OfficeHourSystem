import { cookies } from "next/headers";
import { getIronSession } from "iron-session";

import { getSessionOptions, type SessionData } from "@/lib/session";

export async function POST() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    getSessionOptions(),
  );
  session.destroy();

  return new Response(null, { status: 204 });
}
