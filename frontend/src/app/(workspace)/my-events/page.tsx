import { Suspense } from "react";
import { EventListPage } from "@/components/workspace/event-list-page";

export const metadata = { title: "My events" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <EventListPage mine />
    </Suspense>
  );
}
