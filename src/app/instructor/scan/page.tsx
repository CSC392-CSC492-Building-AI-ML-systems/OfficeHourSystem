import { redirectLegacyOfferingRoute } from "@/lib/legacyOfferingRedirect";

type PageProps = {
  searchParams: Promise<{ offering?: string; sessionId?: string }>;
};

export default async function LegacyInstructorScanRedirect({
  searchParams,
}: PageProps) {
  redirectLegacyOfferingRoute(await searchParams, "/instructor/scan");
}
