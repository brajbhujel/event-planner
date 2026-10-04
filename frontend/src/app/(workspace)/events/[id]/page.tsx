
import { EventDetailPage } from "@/components/workspace/event-detail-page";

export const metadata = { title: "Event details" };

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {

  const { id } = await params;
  return (

      <EventDetailPage id={id} />

  );
}
