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
  type User,
  type Event,
} from "@/validations";
import {
  api,
  ApiError,
  setAuthCookies,
  clearAuthCookies,
} from "./api";
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

type AuthPayload = {
  token?: string;
  refreshToken?: string;
  expiresIn?: number;
  refreshExpiresIn?: number;
  user?: User;
  needsVerification?: boolean;
  email?: string;
  requires2FA?: boolean;
  userId?: string;
  testOtp?: string;
};

export async function authenticate(
  mode: "login" | "signup",
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    const schema = mode === "signup" ? signupSchema : loginSchema;
    const input = schema.parse(Object.fromEntries(form));
    const { data } = await api<{ data: AuthPayload }>(`/auth/${mode}`, {
      method: "POST",
      body: JSON.stringify(input),
    });

    if (data.needsVerification && data.email) {
      return {
        needsVerification: true,
        email: data.email,
        ...(data.testOtp ? { testOtp: data.testOtp } : {}),
      };
    }

    if (data.requires2FA && data.userId) {
      return { requires2FA: true, userId: data.userId };
    }

    if (
      data.token &&
      data.refreshToken &&
      data.expiresIn &&
      data.refreshExpiresIn
    ) {
      await setAuthCookies({
        token: data.token,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
        refreshExpiresIn: data.refreshExpiresIn,
      });
    } else {
      return { error: "Unexpected login response." };
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

    const { data } = await api<{ data: AuthPayload }>("/auth/2fa/session", {
      method: "POST",
      body: JSON.stringify({
        userId: input.userId,
        code: input.code,
        backup: input.backup === "true",
      }),
    });

    if (!data.token || !data.refreshToken || !data.expiresIn || !data.refreshExpiresIn) {
      return { error: "Could not complete 2FA login." };
    }
    await setAuthCookies({
      token: data.token,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn,
      refreshExpiresIn: data.refreshExpiresIn,
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

    await api("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify(input),
    });
  } catch (error) {
    return failure(error);
  }
  return { success: "Email verified. You can sign in now." };
}

export async function resendOtpAction(email: string): Promise<FormState> {
  try {
    const { data } = await api<{ data: { sent: boolean; testOtp?: string } }>(
      "/auth/resend-otp",
      { method: "POST", body: JSON.stringify({ email }) },
    );
    return {
      success: "A new code was sent.",
      ...(data.testOtp ? { testOtp: data.testOtp } : {}),
    };
  } catch (error) {
    return failure(error);
  }
}

export async function logout() {
  try {
    await api("/auth/logout", { method: "POST" });
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 401)) throw error;
  }
  await clearAuthCookies();
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

export async function getTwoFactorStatusAction() {
  await requireUser();
  const { data } = await api<{
    data: { twoFactorEnabled: boolean; backupCodesCount: number };
  }>("/auth/2fa/status");
  return data;
}

export async function setupTwoFactorAction() {
  await requireUser();
  try {
    const { data } = await api<{ data: { qrDataUrl: string; secret: string } }>(
      "/auth/2fa/setup",
      { method: "POST" },
    );
    return data;
  } catch (error) {
    throw new Error(
      error instanceof ApiError ? error.message : "Could not start 2FA setup.",
    );
  }
}

export async function verifyTwoFactorAction(token: string) {
  await requireUser();
  try {
    const { data } = await api<{ data: { backupCodes: string[] } }>(
      "/auth/2fa/verify",
      { method: "POST", body: JSON.stringify({ token }) },
    );
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
    await api("/auth/2fa/disable", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
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
    const result = await api<{ data: Event }>(id ? `/events/${id}` : "/events", {
      method: id ? "PATCH" : "POST",
      body: JSON.stringify(input),
    });
    revalidatePath("/events");
    revalidatePath("/dashboard");
    return {
      success: id ? "Event updated." : "Event created.",
      id: result.data.id,
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
    await api(`/events/${id}`, { method: "DELETE" });
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
