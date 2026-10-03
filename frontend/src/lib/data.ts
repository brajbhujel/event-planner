import "server-only";
import { notFound, redirect } from "next/navigation";
import { api, ApiError } from "./api";
import { requireUser } from "./auth";
import type { Event, EventList, Dashboard } from "@/validations";

async function authenticated<T>(path: string) {
  await requireUser();
  try {
    return await api<T>(path);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect("/login");
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

export const getEvents = (query: URLSearchParams) =>
  authenticated<EventList>(`/events?${query}`);

export const getEvent = async (id: string) =>
  (await authenticated<{ data: Event }>(`/events/${encodeURIComponent(id)}`))
    .data;

export const getDashboard = async () =>
  (await authenticated<{ data: Dashboard }>("/dashboard")).data;

export const getTags = async () =>
  (await authenticated<{ data: string[] }>("/tags")).data;
