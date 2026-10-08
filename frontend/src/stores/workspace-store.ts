"use client";

import { create } from "zustand";
import type { Dashboard, EventList } from "@/validations";
import { eventsService } from "@/services/events.service";

type EventsSlice = {
  data: EventList["data"];
  pagination: EventList["pagination"];
};

type WorkspaceState = {
  eventsByKey: Record<string, EventsSlice>;
  dashboard: Dashboard | null;
  tags: string[] | null;
  loading: boolean;
  error: string | null;

  loadEvents: (query: URLSearchParams | Record<string, string>) => Promise<void>;
  loadDashboard: () => Promise<void>;
  loadTags: () => Promise<void>;
  invalidate: () => void;
};

export function eventsCacheKey(
  query: URLSearchParams | Record<string, string> | string,
) {
  const params = new URLSearchParams(query);
  params.sort();
  return params.toString();
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  eventsByKey: {},
  dashboard: null,
  tags: null,
  loading: false,
  error: null,

  async loadEvents(query) {
    const key = eventsCacheKey(query);
    if (get().eventsByKey[key]) return;

    set({ loading: true, error: null });
    try {
      const result = await eventsService.list(query);
      set((state) => ({
        eventsByKey: {
          ...state.eventsByKey,
          [key]: { data: result.data, pagination: result.pagination },
        },
        loading: false,
      }));
    } catch {
      set({ loading: false, error: "Could not load events. Try again." });
    }
  },

  async loadDashboard() {
    if (get().dashboard) return;

    set({ loading: true, error: null });
    try {
      const dashboard = await eventsService.dashboard();
      set({ dashboard, loading: false });
    } catch {
      set({ loading: false, error: "Could not load dashboard. Try again." });
    }
  },

  async loadTags() {
    if (get().tags) return;

    try {
      const tags = await eventsService.tags();
      set({ tags });
    } catch {
      // tags are optional for filters; ignore hard fail
    }
  },

  invalidate: () =>
    set({
      eventsByKey: {},
      dashboard: null,
      tags: null,
      error: null,
    }),
}));
