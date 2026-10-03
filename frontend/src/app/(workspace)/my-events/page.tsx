import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/workspace/app-shell";
import {
  EventListPage,
  type SearchParams,
} from "@/components/workspace/event-list-page";

export const metadata = { title: "My events" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();
  return (
    <AppShell user={user}>
      <EventListPage searchParams={await searchParams} mine />
    </AppShell>
  );
}
