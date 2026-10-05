import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter a valid email address.").max(254)),
  password: z.string().min(1, "Enter your password.").max(128),
});

export const signupSchema = loginSchema.extend({
  name: z.string().trim().min(2, "Use at least 2 characters.").max(80),
  password: z.string().min(8, "Use at least 8 characters.").max(128),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Use at least 2 characters.").max(80),
});

export const eventSchema = z
  .object({
    title: z.string().trim().min(3, "Use at least 3 characters.").max(120),
    description: z
      .string()
      .trim()
      .min(10, "Tell guests a little more (at least 10 characters).")
      .max(5000),
    startsAt: z.iso.datetime({
      offset: true,
      message: "Choose a valid start date and time.",
    }),
    endsAt: z
      .iso.datetime({ offset: true, message: "Choose a valid end date and time." })
      .nullable()
      .optional(),
    location: z.string().trim().min(2, "Enter a location.").max(200),
    visibility: z.enum(["public", "private", "invite"]),
    tags: z
      .array(z.string().trim().min(1).max(32).toLowerCase())
      .max(5, "Choose up to 5 tags.")
      .transform((tags) => [...new Set(tags)]),
    inviteEmails: z
      .array(z.string().trim().toLowerCase().pipe(z.email().max(254)))
      .max(20, "Invite up to 20 people.")
      .transform((emails) => [...new Set(emails)])
      .default([]),
  })
  .refine(
    (data) => !data.endsAt || new Date(data.endsAt) >= new Date(data.startsAt),
    { message: "End must be after start.", path: ["endsAt"] },
  )
  .refine((data) => new Date(data.startsAt) >= new Date(), {
    message: "Choose a start time in the future.",
    path: ["startsAt"],
  })
  .refine(
    (data) => data.visibility !== "invite" || data.inviteEmails.length > 0,
    {
      message: "Add at least one invitee for invite-only events.",
      path: ["inviteEmails"],
    },
  );

export const listSchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(8),
  search: z.string().trim().max(120).default(""),
  period: z.enum(["all", "upcoming", "past"]).default("upcoming"),
  visibility: z.enum(["all", "public", "private", "invite"]).default("all"),
  tag: z.string().trim().max(32).toLowerCase().default(""),
  mine: z.enum(["true", "false"]).default("false"),
  sort: z.enum(["date-asc", "date-desc", "newest"]).default("date-asc"),
});

export const rsvpSchema = z.object({ status: z.enum(["yes", "no", "maybe"]) });

export type FormState = {
  error?: string;
  success?: string;
  id?: string;
  fields?: Record<string, string[] | undefined>;
  /** Signup / login → go verify email */
  needsVerification?: boolean;
  email?: string;
  /** Login → show 2FA challenge (not an error) */
  requires2FA?: boolean;
  userId?: string;
  /** Non-production OTP echoed from API for local testing */
  testOtp?: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
};

export type Attendee = {
  userId: string;
  name: string;
  email: string;
  status: "yes" | "no" | "maybe" | "pending";
};

export type Event = {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string | null;
  location: string;
  visibility: "public" | "private" | "invite";
  tags: string[];
  inviteEmails: string[];
  creatorId: string;
  creatorName: string;
  createdAt: string;
  updatedAt: string;
  goingCount: number;
  rsvp: "yes" | "no" | "maybe" | null;
  attendees: Attendee[] | null;
};

export type EventList = {
  data: Event[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type Dashboard = {
  upcoming: number;
  past: number;
  mine: number;
  private: number;
  invited: number;
  nextEvent: Event | null;
  recent: Event[];
  months: { month: string; count: number }[];
};
