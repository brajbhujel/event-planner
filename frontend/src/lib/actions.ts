"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  eventSchema,
  loginSchema,
  signupSchema,
  rsvpSchema,
  profileSchema,
  type FormState,
  type User,
  type Event,
} from "@/validations";
import { api, ApiError, SESSION_COOKIE } from "./api";
import { requireUser } from "./auth";

function failure(error: unknown): FormState {
  if (error instanceof z.ZodError) {
    return {
      error: "Check the highlighted fields.",
      fields: z.flattenError(error).fieldErrors,
    };
  }
  if (error instanceof ApiError) {
    return { error: error.message, fields: error.fields };
  }
  console.error("Action failed", error);
  return { error: "Something went wrong. Please try again." };
}

export async function authenticate(
  mode: "login" | "signup",
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    const schema = mode === "signup" ? signupSchema : loginSchema;
    const input = schema.parse(Object.fromEntries(form));
    const { data } = await api<{
      data: { token: string; expiresIn: number; user: User };
    }>(`/auth/${mode}`, { method: "POST", body: JSON.stringify(input) });
    (await cookies()).set(SESSION_COOKIE, data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: data.expiresIn,
    });
  } catch (error) {
    return failure(error);
  }
  redirect("/dashboard");
}

export async function logout() {
  try {
    await api("/auth/logout", { method: "POST" });
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 401)) throw error;
  }
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

export async function updateProfile(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  await requireUser();
  try {
    const input = profileSchema.parse({ name: form.get("name") });
    await api<{ data: User }>("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/", "layout");
  return { success: "Profile updated." };
}

export async function saveEvent(
  id: string | null,
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  await requireUser();
  let event: Event;
  try {
    const startsAt = `${form.get("date")}T${form.get("time")}:00+05:45`;
    const input = eventSchema.parse({
      title: form.get("title"),
      description: form.get("description"),
      location: form.get("location"),
      visibility: form.get("visibility"),
      startsAt,
      tags: String(form.get("tags") ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      inviteEmails: String(form.get("inviteEmails") ?? "")
        .split(/[,\n]/)
        .map((t) => t.trim())
        .filter(Boolean),
    });
    const result = await api<{ data: Event }>(id ? `/events/${id}` : "/events", {
      method: id ? "PATCH" : "POST",
      body: JSON.stringify(input),
    });
    event = result.data;
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/events");
  revalidatePath("/dashboard");
  redirect(`/events/${event.id}?saved=${id ? "updated" : "created"}`);
}

export async function removeEvent(
  id: string,
  _state: FormState,
): Promise<FormState> {
  await requireUser();
  try {
    await api(`/events/${id}`, { method: "DELETE" });
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/events");
  revalidatePath("/dashboard");
  redirect("/events?notice=deleted");
}

export async function updateRsvp(
  id: string,
  status: "yes" | "no" | "maybe",
): Promise<FormState> {
  await requireUser();
  try {
    rsvpSchema.parse({ status });
    await api(`/events/${id}/rsvp`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  } catch (error) {
    return failure(error);
  }
  revalidatePath(`/events/${id}`);
  return { success: "RSVP updated." };
}
