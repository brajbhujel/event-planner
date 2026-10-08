import { describe, expect, it } from "vitest";
import {
  eventSchema,
  listSchema,
  loginSchema,
  profileSchema,
  rsvpSchema,
  signupSchema,
} from "./index";

/** Future start time so eventSchema's "must be in the future" rule passes */
function tomorrowAt(hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString().replace("Z", "+00:00");
}

describe("signupSchema", () => {
  it("accepts a valid signup", () => {
    const result = signupSchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "password1",
    });
    expect(result.success).toBe(true);
  });

  it("lowercases email", () => {
    const result = signupSchema.parse({
      name: "Ada",
      email: "Ada@Example.COM",
      password: "password1",
    });
    expect(result.email).toBe("ada@example.com");
  });

  it("rejects short password", () => {
    const result = signupSchema.safeParse({
      name: "Ada",
      email: "ada@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short name", () => {
    const result = signupSchema.safeParse({
      name: "A",
      email: "ada@example.com",
      password: "password1",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts email + password", () => {
    expect(
      loginSchema.safeParse({
        email: "ada@example.com",
        password: "x",
      }).success,
    ).toBe(true);
  });

  it("rejects bad email", () => {
    expect(
      loginSchema.safeParse({
        email: "not-an-email",
        password: "x",
      }).success,
    ).toBe(false);
  });
});

describe("profileSchema", () => {
  it("accepts a normal name", () => {
    expect(profileSchema.safeParse({ name: "New Name" }).success).toBe(true);
  });

  it("rejects empty name", () => {
    expect(profileSchema.safeParse({ name: "" }).success).toBe(false);
  });
});

describe("eventSchema", () => {
  const base = {
    title: "Design workshop",
    description: "A short workshop description.",
    location: "Kathmandu",
    visibility: "public" as const,
    tags: ["workshop"],
    startsAt: tomorrowAt(10),
    endsAt: null,
    inviteEmails: [] as string[],
  };

  it("accepts a public event", () => {
    expect(eventSchema.safeParse(base).success).toBe(true);
  });

  it("rejects title that is too short", () => {
    expect(
      eventSchema.safeParse({ ...base, title: "Hi" }).success,
    ).toBe(false);
  });

  it("rejects start time in the past", () => {
    expect(
      eventSchema.safeParse({
        ...base,
        startsAt: "2020-01-01T10:00:00+05:45",
      }).success,
    ).toBe(false);
  });

  it("rejects end before start", () => {
    expect(
      eventSchema.safeParse({
        ...base,
        startsAt: tomorrowAt(14),
        endsAt: tomorrowAt(10),
      }).success,
    ).toBe(false);
  });

  it("requires invite emails for invite-only events", () => {
    expect(
      eventSchema.safeParse({
        ...base,
        visibility: "invite",
        inviteEmails: [],
      }).success,
    ).toBe(false);
  });

  it("accepts invite-only with at least one invitee", () => {
    expect(
      eventSchema.safeParse({
        ...base,
        visibility: "invite",
        inviteEmails: ["guest@example.com"],
      }).success,
    ).toBe(true);
  });

  it("dedupes tags and lowercases them", () => {
    const result = eventSchema.parse({
      ...base,
      tags: ["Workshop", "workshop", "Design"],
    });
    expect(result.tags).toEqual(["workshop", "design"]);
  });

  it("rejects more than 5 tags", () => {
    expect(
      eventSchema.safeParse({
        ...base,
        tags: ["a", "b", "c", "d", "e", "f"],
      }).success,
    ).toBe(false);
  });
});

describe("listSchema", () => {
  it("applies defaults when query is empty", () => {
    const result = listSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(8);
    expect(result.period).toBe("all");
    expect(result.visibility).toBe("all");
    expect(result.mine).toBe("false");
    expect(result.sort).toBe("date-asc");
  });

  it("coerces page from string query params", () => {
    const result = listSchema.parse({ page: "3", pageSize: "12" });
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(12);
  });

  it("rejects pageSize over 50", () => {
    expect(listSchema.safeParse({ pageSize: "100" }).success).toBe(false);
  });
});

describe("rsvpSchema", () => {
  it("accepts yes / no / maybe", () => {
    expect(rsvpSchema.safeParse({ status: "yes" }).success).toBe(true);
    expect(rsvpSchema.safeParse({ status: "no" }).success).toBe(true);
    expect(rsvpSchema.safeParse({ status: "maybe" }).success).toBe(true);
  });

  it("rejects unknown status", () => {
    expect(rsvpSchema.safeParse({ status: "later" }).success).toBe(false);
  });
});
