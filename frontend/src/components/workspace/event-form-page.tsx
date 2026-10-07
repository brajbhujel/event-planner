"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ChevronLeftIcon } from "@radix-ui/react-icons";
import type { Event } from "@/validations";
import { eventsService } from "@/services/events.service";
import { useWorkspaceUser } from "./user-context";
import { PageHeading } from "@/components/page-heading";
import { EventForm } from "./event-form";

export function NewEventPage() {
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

export function EditEventPage({ id }: { id: string }) {
  const user = useWorkspaceUser();
  const [event, setEvent] = useState<Event | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!z.uuid().safeParse(id).success) {
      setMissing(true);
      return;
    }
    let cancelled = false;
    eventsService
      .get(id)
      .then((next) => {
        if (cancelled) return;
        if (next.creatorId !== user.id || new Date(next.startsAt) < new Date()) {
          setMissing(true);
          return;
        }
        setEvent(next);
      })
      .catch(() => {
        if (!cancelled) setMissing(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id, user.id]);

  if (missing) notFound();
  if (!event) {
    return <p className="text-sm text-muted-foreground">Loading event…</p>;
  }

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
