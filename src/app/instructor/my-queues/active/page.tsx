import { redirectLegacyOfferingRoute } from "@/lib/legacyOfferingRedirect";

type PageProps = {
  searchParams: Promise<{ offering?: string; sessionId?: string }>;
};

export default async function LegacyInstructorActiveQueueRedirect({
  searchParams,
}: PageProps) {
  redirectLegacyOfferingRoute(
    await searchParams,
    "/instructor/my-queues/active",
  );
}
