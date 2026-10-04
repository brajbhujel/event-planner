"use server";

import { getDashboard, getEvents, getTags } from "@/lib/data";
import type { Dashboard, EventList } from "@/validations";

export async function loadEventsAction(
  query: Record<string, string>,
): Promise<EventList> {
  const params = new URLSearchParams(query);
  return getEvents(params);
}

export async function loadDashboardAction(): Promise<Dashboard> {
  return getDashboard();
}

export async function loadTagsAction(): Promise<string[]> {
  return getTags();
}
