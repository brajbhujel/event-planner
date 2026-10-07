import api from "@/config/api";
import type { Dashboard, Event, EventInput, EventList } from "@/validations";

export type RsvpStatus = "yes" | "no" | "maybe";

export const eventsService = {
  async list(query: URLSearchParams | Record<string, string>): Promise<EventList> {
    const params =
      query instanceof URLSearchParams ? query : new URLSearchParams(query);
    const response = await api.get(`/events?${params}`);
    return response.data;
  },

  async get(id: string): Promise<Event> {
    const response = await api.get(`/events/${encodeURIComponent(id)}`);
    return response.data.data;
  },

  async create(input: EventInput): Promise<Event> {
    const response = await api.post("/events", input);
    return response.data.data;
  },

  async update(id: string, input: Partial<EventInput>): Promise<Event> {
    const response = await api.patch(`/events/${id}`, input);
    return response.data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/events/${id}`);
  },

  async rsvp(id: string, status: RsvpStatus): Promise<void> {
    await api.put(`/events/${id}/rsvp`, { status });
  },

  async dashboard(): Promise<Dashboard> {
    const response = await api.get("/dashboard");
    return response.data.data;
  },

  async tags(): Promise<string[]> {
    const response = await api.get("/tags");
    return response.data.data;
  },
};
