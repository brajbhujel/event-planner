import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/workspace/app-shell";
import { EditEventPage } from "@/components/workspace/event-form-page";

export const metadata = { title: "Edit event" };

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  return (
    <AppShell user={user}>
      <EditEventPage id={id} />
    </AppShell>
  );
}
