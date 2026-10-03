import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/workspace/app-shell";
import { NewEventPage } from "@/components/workspace/event-form-page";

export const metadata = { title: "Create event" };

export default async function Page() {
  const user = await requireUser();
  return (
    <AppShell user={user}>
      <NewEventPage />
    </AppShell>
  );
}
