import { randomUUID } from "node:crypto";
import type { Knex } from "knex";
import type {
  Attendee,
  Event,
  EventInput,
  EventPatch,
  ListInput,
  Dashboard,
} from "../validations";
import { db } from "../config/db";
import { AppError } from "../middleware/error";

export function visibleEvents(
  userId: string,
  connection: Knex | Knex.Transaction = db,
) {
  return connection("events as e").where((q) =>
    q
      .where("e.visibility", "public")
      .orWhere("e.creator_id", userId)
      .orWhere((invite) =>
        invite.where("e.visibility", "invite").whereExists(
          connection("invitations as i")
            .whereRaw("i.event_id = e.id")
            .where("i.user_id", userId)
            .select(connection.raw("1")),
        ),
      ),
  );
}

function eventSelect(userId: string, connection: Knex | Knex.Transaction = db) {
  return visibleEvents(userId, connection)
    .join("users as u", "u.id", "e.creator_id")
    .select(
      "e.id",
      "e.title",
      "e.description",
      "e.location",
      "e.visibility",
      "e.starts_at as startsAt",
      "e.ends_at as endsAt",
      "e.creator_id as creatorId",
      "u.name as creatorName",
      "e.created_at as createdAt",
      "e.updated_at as updatedAt",
      connection.raw(
        "coalesce((select json_agg(t.name order by t.name) from event_tags et join tags t on t.id = et.tag_id where et.event_id = e.id), '[]') as tags",
      ),
      connection.raw(
        "(select count(*)::int from rsvps r where r.event_id = e.id and r.status = 'yes') as \"goingCount\"",
      ),
      connection.raw(
        "(select status from rsvps r where r.event_id = e.id and r.user_id = ?) as rsvp",
        [userId],
      ),
    );
}

async function inviteEmailsFor(
  eventId: string,
  connection: Knex | Knex.Transaction = db,
) {
  const rows = await connection("invitations as i")
    .join("users as u", "u.id", "i.user_id")
    .where("i.event_id", eventId)
    .orderBy("u.email")
    .select("u.email");
  return rows.map((r) => r.email as string);
}

async function attendeesFor(
  event: { id: string; visibility: string },
  connection: Knex | Knex.Transaction = db,
): Promise<Attendee[] | null> {
  if (event.visibility === "private") return null;

  if (event.visibility === "public") {
    const rows = await connection("rsvps as r")
      .join("users as u", "u.id", "r.user_id")
      .where("r.event_id", event.id)
      .orderBy("u.name")
      .select("u.id as userId", "u.name", "u.email", "r.status");
    return rows.map((r) => ({
      userId: r.userId,
      name: r.name,
      email: r.email,
      status: r.status,
    }));
  }

  // invite-only: every invitee, pending if no RSVP yet
  const rows = await connection("invitations as i")
    .join("users as u", "u.id", "i.user_id")
    .leftJoin("rsvps as r", function () {
      this.on("r.event_id", "=", "i.event_id").andOn(
        "r.user_id",
        "=",
        "i.user_id",
      );
    })
    .where("i.event_id", event.id)
    .orderBy("u.name")
    .select(
      "u.id as userId",
      "u.name",
      "u.email",
      connection.raw("coalesce(r.status, 'pending') as status"),
    );
  return rows.map((r) => ({
    userId: r.userId,
    name: r.name,
    email: r.email,
    status: r.status,
  }));
}

async function hydrateEvent(
  row: Record<string, unknown>,
  connection: Knex | Knex.Transaction = db,
): Promise<Event> {
  const inviteEmails =
    row.visibility === "invite"
      ? await inviteEmailsFor(String(row.id), connection)
      : [];
  const attendees = await attendeesFor(
    { id: String(row.id), visibility: String(row.visibility) },
    connection,
  );
  return {
    ...(row as unknown as Event),
    inviteEmails,
    attendees,
  };
}

export async function getEvent(id: string, userId: string): Promise<Event> {
  const event = await eventSelect(userId).where("e.id", id).first();
  if (!event) throw new AppError(404, "This event could not be found.");
  return hydrateEvent(event);
}

export async function listEvents(input: ListInput, userId: string) {
  const base = visibleEvents(userId);
  if (input.period !== "all") {
    base.where(
      "e.starts_at",
      input.period === "past" ? "<" : ">=",
      db.fn.now(),
    );
  }
  if (input.visibility !== "all") base.where("e.visibility", input.visibility);
  if (input.mine === "true") base.where("e.creator_id", userId);
  if (input.search) {
    const pattern = `%${input.search.replace(/[\\%_]/g, "\\$&")}%`;
    base.where((q) =>
      q
        .whereILike("e.title", pattern)
        .orWhereILike("e.description", pattern)
        .orWhereILike("e.location", pattern),
    );
  }
  if (input.tag) {
    base.whereExists(
      db("event_tags as et")
        .join("tags as t", "t.id", "et.tag_id")
        .whereRaw("et.event_id = e.id")
        .where("t.name", input.tag)
        .select(db.raw("1")),
    );
  }

  const count = await base.clone().count("e.id as total").first();
  const total = Number(count?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / input.pageSize));
  const page = Math.min(input.page, totalPages);
  const order = input.sort === "newest" ? "e.created_at" : "e.starts_at";
  const direction = input.sort === "date-asc" ? "asc" : "desc";
  const ids = base.clone().select("e.id");
  const rows = await eventSelect(userId)
    .whereIn("e.id", ids)
    .orderBy(order, direction)
    .orderBy("e.id")
    .limit(input.pageSize)
    .offset((page - 1) * input.pageSize);

  // list view skips full attendee lists for speed
  const data = rows.map((row) => ({
    ...row,
    inviteEmails: [],
    attendees: null,
  })) as Event[];

  return {
    data,
    pagination: { page, pageSize: input.pageSize, total, totalPages },
  };
}

async function syncTags(
  trx: Knex.Transaction,
  eventId: string,
  tags: string[],
) {
  await trx("event_tags").where({ event_id: eventId }).delete();
  if (!tags.length) return;
  await trx("tags")
    .insert(tags.map((name) => ({ name })))
    .onConflict("name")
    .ignore();
  const rows = await trx("tags").whereIn("name", tags).select("id");
  await trx("event_tags").insert(
    rows.map(({ id }) => ({ event_id: eventId, tag_id: id })),
  );
}

async function syncInvites(
  trx: Knex.Transaction,
  eventId: string,
  emails: string[],
  creatorId: string,
) {
  await trx("invitations").where({ event_id: eventId }).delete();
  if (!emails.length) return;

  const creator = await trx("users").where({ id: creatorId }).first("email");
  const targets = emails.filter((email) => email !== creator?.email);
  if (!targets.length) {
    throw new AppError(422, "Add at least one invitee besides yourself.");
  }

  const users = await trx("users")
    .whereIn("email", targets)
    .select("id", "email");
  const found = new Set(users.map((u) => u.email));
  const missing = targets.filter((email) => !found.has(email));
  if (missing.length) {
    throw new AppError(
      422,
      `No account found for: ${missing.join(", ")}. They need to sign up first.`,
    );
  }
  await trx("invitations").insert(
    users.map((u) => ({ event_id: eventId, user_id: u.id })),
  );
}

function assertUpcoming(startsAt: string | Date, message: string) {
  if (new Date(startsAt) < new Date()) {
    throw new AppError(409, message);
  }
}

export async function createEvent(input: EventInput, userId: string) {
  assertUpcoming(input.startsAt, "Choose a start time in the future.");
  if (input.visibility === "invite" && input.inviteEmails.length === 0) {
    throw new AppError(422, "Add at least one invitee for invite-only events.");
  }

  const id = randomUUID();
  await db.transaction(async (trx) => {
    await trx("events").insert({
      id,
      creator_id: userId,
      title: input.title,
      description: input.description,
      starts_at: input.startsAt,
      ends_at: input.endsAt ?? null,
      location: input.location,
      visibility: input.visibility,
    });
    await syncTags(trx, id, input.tags);
    if (input.visibility === "invite") {
      await syncInvites(trx, id, input.inviteEmails, userId);
    }
  });
  return getEvent(id, userId);
}

export async function updateEvent(
  id: string,
  input: EventPatch,
  userId: string,
) {
  await db.transaction(async (trx) => {
    const event = await visibleEvents(userId, trx).where("e.id", id).first();
    if (!event) throw new AppError(404, "This event could not be found.");
    if (event.creator_id !== userId) {
      throw new AppError(403, "Only the organizer can edit this event.");
    }
    assertUpcoming(event.starts_at, "Past events can’t be edited.");

    const { tags, startsAt, endsAt, inviteEmails, ...rest } = input;
    if (startsAt) {
      assertUpcoming(startsAt, "Choose a start time in the future.");
    }

    const visibility = rest.visibility ?? event.visibility;
    if (visibility === "invite" && inviteEmails && inviteEmails.length === 0) {
      throw new AppError(422, "Add at least one invitee for invite-only events.");
    }

    await trx("events")
      .where({ id, creator_id: userId })
      .update({
        ...rest,
        ...(startsAt ? { starts_at: startsAt } : {}),
        ...(endsAt !== undefined ? { ends_at: endsAt } : {}),
        updated_at: trx.fn.now(),
      });
    if (tags) await syncTags(trx, id, tags);

    if (visibility === "invite" && inviteEmails) {
      await syncInvites(trx, id, inviteEmails, userId);
    }
    if (visibility !== "invite" && (rest.visibility || inviteEmails)) {
      await trx("invitations").where({ event_id: id }).delete();
    }
  });
  return getEvent(id, userId);
}

export async function deleteEvent(id: string, userId: string) {
  const event = await getEvent(id, userId);
  if (event.creatorId !== userId) {
    throw new AppError(403, "Only the organizer can delete this event.");
  }
  await db("events").where({ id, creator_id: userId }).delete();
}

export async function setRsvp(
  id: string,
  userId: string,
  status: "yes" | "no" | "maybe",
) {
  const event = await visibleEvents(userId).where("e.id", id).first();
  if (!event) throw new AppError(404, "This event could not be found.");
  if (event.visibility === "private") {
    throw new AppError(403, "Private events don’t accept RSVPs.");
  }
  if (new Date(event.starts_at) < new Date()) {
    throw new AppError(409, "RSVPs are closed for past events.");
  }
  if (event.visibility === "invite" && event.creator_id !== userId) {
    const invited = await db("invitations")
      .where({ event_id: id, user_id: userId })
      .first();
    if (!invited) throw new AppError(403, "You’re not invited to this event.");
  }
  await db("rsvps")
    .insert({ event_id: id, user_id: userId, status })
    .onConflict(["event_id", "user_id"])
    .merge(["status"]);
  return { status };
}

export async function listTags(userId: string): Promise<string[]> {
  const tags = await db("tags as t")
    .join("event_tags as et", "et.tag_id", "t.id")
    .whereIn("et.event_id", visibleEvents(userId).select("e.id"))
    .distinct("t.name")
    .orderBy("t.name");
  return tags.map((t) => t.name as string);
}

export async function dashboard(userId: string): Promise<Dashboard> {
  const [counts, nextEvent, recent, months] = await Promise.all([
    visibleEvents(userId)
      .select(
        db.raw(
          `count(*) filter (where starts_at >= now())::int as upcoming,
           count(*) filter (where starts_at < now())::int as past,
           count(*) filter (where creator_id = ?)::int as mine,
           count(*) filter (where visibility = 'private')::int as private,
           count(*) filter (where visibility = 'invite')::int as invited`,
          [userId],
        ),
      )
      .first(),
    eventSelect(userId)
      .where("e.starts_at", ">=", db.fn.now())
      .orderBy("e.starts_at")
      .first(),
    eventSelect(userId).orderBy("e.created_at", "desc").orderBy("e.id").limit(5),
    visibleEvents(userId)
      .whereRaw(
        "e.starts_at >= date_trunc('month', now()) and e.starts_at < date_trunc('month', now()) + interval '6 months'",
      )
      .select(db.raw("to_char(e.starts_at, 'YYYY-MM') as month"))
      .count("e.id as count")
      .groupByRaw("1")
      .orderByRaw("1"),
  ]);

  return {
    upcoming: Number(counts?.upcoming ?? 0),
    past: Number(counts?.past ?? 0),
    mine: Number(counts?.mine ?? 0),
    private: Number(counts?.private ?? 0),
    invited: Number(counts?.invited ?? 0),
    nextEvent: nextEvent
      ? ({ ...nextEvent, inviteEmails: [], attendees: null } as Event)
      : null,
    recent: recent.map((row) => ({
      ...row,
      inviteEmails: [],
      attendees: null,
    })) as Event[],
    months: months.map((m) => ({
      month: String(m.month),
      count: Number(m.count),
    })),
  };
}
