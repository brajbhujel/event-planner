import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/workspace/app-shell";
import { EventDetailPage } from "@/components/workspace/event-detail-page";

export const metadata = { title: "Event details" };

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  return (
    <AppShell user={user}>
      <EventDetailPage id={id} />
    </AppShell>
  );
}
