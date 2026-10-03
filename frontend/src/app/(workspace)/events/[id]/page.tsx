import { EventDetailPage } from "@/components/workspace/event-detail-page";

export const metadata = { title: "Event details" };

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;
  return <EventDetailPage id={id} saved={saved} />;
}
