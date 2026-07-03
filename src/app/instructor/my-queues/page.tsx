import { redirectLegacyOfferingRoute } from "@/lib/legacyOfferingRedirect";

type PageProps = {
  searchParams: Promise<{ offering?: string }>;
};

export default async function LegacyInstructorMyQueuesRedirect({
  searchParams,
}: PageProps) {
  redirectLegacyOfferingRoute(await searchParams, "/instructor/my-queues");
}
