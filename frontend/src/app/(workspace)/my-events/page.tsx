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
  return <EventListPage searchParams={await searchParams} mine />;
}
