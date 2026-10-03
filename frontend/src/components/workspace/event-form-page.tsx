import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ChevronLeftIcon } from "@radix-ui/react-icons";
import { getEvent } from "@/lib/data";
import { requireUser } from "@/lib/auth";
import { PageHeading } from "@/components/page-heading";
import { EventForm } from "./event-form";

export async function NewEventPage() {
  await requireUser();
  return (
    <>
      <Link
        href="/events"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
      >
        <ChevronLeftIcon />
        Back to events
      </Link>
      <PageHeading
        title="Create event"
        description="Add the details for your next gathering."
      />
      <EventForm />
    </>
  );
}

export async function EditEventPage({ id }: { id: string }) {
  if (!z.uuid().safeParse(id).success) notFound();
  const [user, event] = await Promise.all([requireUser(), getEvent(id)]);
  if (event.creatorId !== user.id) notFound();
  if (new Date(event.startsAt) < new Date()) notFound();
  return (
    <>
      <Link
        href={`/events/${id}`}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
      >
        <ChevronLeftIcon />
        Back to event
      </Link>
      <PageHeading
        title="Edit event"
        description="Update the details for this event."
      />
      <EventForm event={event} />
    </>
  );
}
