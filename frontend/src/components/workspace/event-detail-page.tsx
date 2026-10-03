import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import {
  ChevronLeftIcon,
  Pencil1Icon,
  CalendarIcon,
  ClockIcon,
  PinRightIcon,
  PersonIcon,
} from "@radix-ui/react-icons";
import { getEvent } from "@/lib/data";
import { requireUser } from "@/lib/auth";
import { formatDate, formatTime, initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VisibilityBadge } from "./event-table";
import { DeleteEvent } from "./delete-event";
import { RsvpForm } from "./rsvp-form";
import { AttendeesList } from "./attendees-list";
import { SavedToast } from "./saved-toast";

export async function EventDetailPage({
  id,
  saved,
}: {
  id: string;
  saved?: string;
}) {
  if (!z.uuid().safeParse(id).success) notFound();
  const [event, user] = await Promise.all([getEvent(id), requireUser()]);
  const owner = event.creatorId === user.id;
  const past = new Date(event.startsAt) < new Date();

  return (
    <>
      <SavedToast saved={saved} />
      <Link
        href="/events"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
      >
        <ChevronLeftIcon />
        Back to events
      </Link>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap gap-2">
            <VisibilityBadge visibility={event.visibility} />
            <Badge>{past ? "Past event" : "Upcoming"}</Badge>
          </div>
          <h1 className="break-words text-3xl font-semibold tracking-tight">
            {event.title}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Organized by {event.creatorName}
            {owner ? " (you)" : ""}
          </p>
        </div>
        {owner && (
          <div className="flex shrink-0 gap-2">
            <DeleteEvent id={id} title={event.title} />
            {past ? (
              <Button disabled title="Past events can’t be edited">
                <Pencil1Icon />
                Edit event
              </Button>
            ) : (
              <Button asChild>
                <Link href={`/events/${id}/edit`}>
                  <Pencil1Icon />
                  Edit event
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold">About this event</h2>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap break-words text-sm leading-7 text-muted-foreground">
                {event.description}
              </p>
              {event.tags.length > 0 && (
                <div className="mt-7 flex flex-wrap gap-2 border-t pt-5">
                  {event.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/events?period=all&tag=${encodeURIComponent(tag)}`}
                    >
                      <Badge className="capitalize hover:bg-muted">{tag}</Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          {event.visibility !== "private" && (
            <Card>
              <CardContent>
                <RsvpForm event={event} past={past} />
              </CardContent>
            </Card>
          )}
          <AttendeesList
            attendees={event.attendees}
            visibility={event.visibility}
          />
        </div>
        <aside className="space-y-5">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold">Details</h2>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                {
                  icon: CalendarIcon,
                  label: "Date",
                  value: formatDate(event.startsAt, { weekday: "long" }),
                },
                {
                  icon: ClockIcon,
                  label: "Time",
                  value: `${formatTime(event.startsAt)} · Nepal Time`,
                },
                {
                  icon: PinRightIcon,
                  label: "Location",
                  value: event.location,
                },
                {
                  icon: PersonIcon,
                  label: "Going",
                  value: `${event.goingCount} going`,
                },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-3">
                  <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="mt-1 break-words text-sm font-medium">
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-muted-foreground">Organizer</p>
              <div className="mt-3 flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary/8 text-sm font-medium text-primary">
                  {initials(event.creatorName)}
                </span>
                <div>
                  <p className="text-sm font-medium">{event.creatorName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Event creator{owner ? " · You" : ""}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}
