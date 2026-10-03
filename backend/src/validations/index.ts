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

const inviteEmails = z
  .array(z.string().trim().toLowerCase().pipe(z.email().max(254)))
  .max(20, "Invite up to 20 people.")
  .transform((emails) => [...new Set(emails)])
  .default([]);

export const eventSchema = z.object({
  title: z.string().trim().min(3, "Use at least 3 characters.").max(120),
  description: z
    .string()
    .trim()
    .min(10, "Tell guests a little more (at least 10 characters).")
    .max(5000),
  startsAt: z.iso.datetime({
    offset: true,
    message: "Choose a valid date and time.",
  }),
  location: z.string().trim().min(2, "Enter a location.").max(200),
  visibility: z.enum(["public", "private", "invite"]),
  tags: z
    .array(z.string().trim().min(1).max(32).toLowerCase())
    .max(5, "Choose up to 5 tags.")
    .transform((tags) => [...new Set(tags)]),
  inviteEmails,
});

export const eventPatchSchema = eventSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, "Provide at least one field.");

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

export type EventInput = z.infer<typeof eventSchema>;
export type EventPatch = z.infer<typeof eventPatchSchema>;
export type ListInput = z.infer<typeof listSchema>;
export type User = { id: string; name: string; email: string };
export type Attendee = {
  userId: string;
  name: string;
  email: string;
  status: "yes" | "no" | "maybe" | "pending";
};
export type Event = Omit<EventInput, "inviteEmails"> & {
  id: string;
  creatorId: string;
  creatorName: string;
  createdAt: string;
  updatedAt: string;
  goingCount: number;
  rsvp: "yes" | "no" | "maybe" | null;
  inviteEmails: string[];
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
  nextEvent: Event | null;
  recent: Event[];
  months: { month: string; count: number }[];
};
