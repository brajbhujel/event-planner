"use server";
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
} from "@/validations";
import { authService, ApiError } from "@/services/auth.service";
import { eventsService } from "@/services/events.service";
import { requireUser } from "./auth";

export async function listEvents(query: Record<string, string>) {
  return eventsService.list(query);
}

export async function getDashboard() {
  return eventsService.dashboard();
}

export async function getTags() {
  return eventsService.tags();
}

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
    if (mode === "signup") {
      const input = signupSchema.parse(Object.fromEntries(form));
      const data = await authService.signup(input);
      if (data.needsVerification && data.email) {
        return {
          needsVerification: true,
          email: data.email,
          ...(data.testOtp ? { testOtp: data.testOtp } : {}),
        };
      }
      return { error: "Unexpected signup response." };
    }

    const input = loginSchema.parse(Object.fromEntries(form));
    const result = await authService.login(input);

    if (result.kind === "needsVerification") {
      return {
        needsVerification: true,
        email: result.email,
        ...(result.testOtp ? { testOtp: result.testOtp } : {}),
      };
    }
    if (result.kind === "requires2FA") {
      return { requires2FA: true, userId: result.userId };
    }
  } catch (error) {
    return failure(error);
  }
  redirect("/dashboard");
}

export async function completeTwoFactorLogin(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    const input = z
      .object({
        userId: z.uuid(),
        code: z.string().trim().min(6).max(16),
        backup: z.enum(["true", "false"]).optional(),
      })
      .parse(Object.fromEntries(form));

    await authService.completeTwoFactor({
      userId: input.userId,
      code: input.code,
      backup: input.backup === "true",
    });
  } catch (error) {
    return failure(error);
  }
  redirect("/dashboard");
}

export async function verifyEmailAction(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    const input = z
      .object({
        email: z.string().trim().toLowerCase().pipe(z.email()),
        code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code."),
      })
      .parse(Object.fromEntries(form));
    await authService.verifyEmail(input);
  } catch (error) {
    return failure(error);
  }
  return { success: "Email verified. You can sign in now." };
}

export async function resendOtpAction(email: string): Promise<FormState> {
  try {
    const data = await authService.resendOtp(email);
    return {
      success: "A new code was sent.",
      ...(data.testOtp ? { testOtp: data.testOtp } : {}),
    };
  } catch (error) {
    return failure(error);
  }
}

export async function logout() {
  await authService.logout();
  await authService.clearSession();
  redirect("/login");
}

export async function updateProfile(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  await requireUser();
  try {
    const input = profileSchema.parse({ name: form.get("name") });
    await authService.updateProfile(input);
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/", "layout");
  return { success: "Profile updated." };
}

export async function getTwoFactorStatusAction() {
  await requireUser();
  return authService.twoFactorStatus();
}

export async function setupTwoFactorAction() {
  await requireUser();
  try {
    return await authService.setupTwoFactor();
  } catch (error) {
    throw new Error(
      error instanceof ApiError ? error.message : "Could not start 2FA setup.",
    );
  }
}

export async function verifyTwoFactorAction(token: string) {
  await requireUser();
  try {
    const data = await authService.verifyTwoFactor(token);
    revalidatePath("/profile");
    return data;
  } catch (error) {
    throw new Error(
      error instanceof ApiError ? error.message : "Invalid authenticator code.",
    );
  }
}

export async function disableTwoFactorAction(token: string) {
  await requireUser();
  try {
    await authService.disableTwoFactor(token);
    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    throw new Error(
      error instanceof ApiError ? error.message : "Could not disable 2FA.",
    );
  }
}

export async function saveEvent(
  id: string | null,
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  await requireUser();
  try {
    const multi = form.get("multiDay") === "true";
    const startsAt = `${form.get("date")}T${form.get("time")}:00+05:45`;
    const endsAt =
      multi && form.get("endDate") && form.get("endTime")
        ? `${form.get("endDate")}T${form.get("endTime")}:00+05:45`
        : null;
    const input = eventSchema.parse({
      title: form.get("title"),
      description: form.get("description"),
      location: form.get("location"),
      visibility: form.get("visibility"),
      startsAt,
      endsAt,
      tags: String(form.get("tags") ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      inviteEmails: String(form.get("inviteEmails") ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
    const result = id
      ? await eventsService.update(id, input)
      : await eventsService.create(input);
    revalidatePath("/events");
    revalidatePath("/dashboard");
    return {
      success: id ? "Event updated." : "Event created.",
      id: result.id,
    };
  } catch (error) {
    return failure(error);
  }
}

export async function removeEvent(
  id: string,
  _state: FormState,
): Promise<FormState> {
  await requireUser();
  try {
    await eventsService.remove(id);
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/events");
  revalidatePath("/dashboard");
  return { success: "Event deleted." };
}

export async function updateRsvp(
  id: string,
  status: "yes" | "no" | "maybe",
): Promise<FormState> {
  await requireUser();
  try {
    rsvpSchema.parse({ status });
    await eventsService.rsvp(id, status);
  } catch (error) {
    return failure(error);
  }
  revalidatePath(`/events/${id}`);
  return { success: "RSVP updated." };
}
