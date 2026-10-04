"use client";

import { create } from "zustand";
import type { Dashboard, EventList } from "@/validations";

type EventsSlice = {
  data: EventList["data"];
  pagination: EventList["pagination"];
};

type WorkspaceState = {
  eventsByKey: Record<string, EventsSlice>;
  dashboard: Dashboard | null;
  tags: string[] | null;
  setEvents: (key: string, value: EventsSlice) => void;
  setDashboard: (value: Dashboard) => void;
  setTags: (value: string[]) => void;
  invalidate: () => void;
};

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  eventsByKey: {},
  dashboard: null,
  tags: null,
  setEvents: (key, value) =>
    set((state) => ({
      eventsByKey: { ...state.eventsByKey, [key]: value },
    })),
  setDashboard: (value) => set({ dashboard: value }),
  setTags: (value) => set({ tags: value }),
  invalidate: () =>
    set({
      eventsByKey: {},
      dashboard: null,
      tags: null,
    }),
}));

export function eventsCacheKey(query: URLSearchParams | string) {
  const params =
    typeof query === "string" ? new URLSearchParams(query) : new URLSearchParams(query);
  params.sort();
  return params.toString();
}
