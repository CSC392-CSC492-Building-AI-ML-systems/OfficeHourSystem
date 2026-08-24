import { isAdmin } from "@/lib/adminList";
import {
  getRequestSession,
  parseSessionUserId,
} from "@/lib/auth/getRequestSession";
import {
  getHomeHeroStatsForUser,
  type HomeHeroStats,
} from "@/lib/queries/home_stats/home-stats";
import type { SessionData } from "@/lib/session";

type ReadyHomeHeroStats = Exclude<
  HomeHeroStats,
  { kind: "anonymous" | "unavailable" }
>;

export type HomeStatsServiceDependencies = {
  getSession?: () => Promise<SessionData | null>;
  loadStats?: (
    userId: number,
    isAdminUser: boolean,
  ) => Promise<ReadyHomeHeroStats | null>;
  checkAdmin?: (utorid: string) => boolean;
};

export async function getHomeHeroStatsService(
  dependencies: HomeStatsServiceDependencies = {},
): Promise<HomeHeroStats> {
  const getSession = dependencies.getSession ?? getRequestSession;
  const loadStats = dependencies.loadStats ?? getHomeHeroStatsForUser;
  const checkAdmin = dependencies.checkAdmin ?? isAdmin;
  let session;
  try {
    session = await getSession();
    if (!session) return { kind: "anonymous" };
  } catch {
    // A malformed or expired public-page cookie is equivalent to signed out.
    return { kind: "anonymous" };
  }

  let userId: number;
  try {
    userId = parseSessionUserId(session);
  } catch {
    return { kind: "anonymous" };
  }

  try {
    const stats = await loadStats(userId, checkAdmin(session.utorid));
    return stats ?? { kind: "anonymous" };
  } catch (error) {
    console.error("[home-stats] Failed to load hero statistics", error);
    return { kind: "unavailable" };
  }
}
