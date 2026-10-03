import Link from "next/link";
import {
  ArrowRightIcon,
  GlobeIcon,
  LockClosedIcon,
  CalendarIcon,
  PersonIcon,
  EnvelopeClosedIcon,
} from "@radix-ui/react-icons";
import type { Event } from "@/validations";
import { formatDate, formatTime } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { TagChip } from "@/components/tag-input";

export function VisibilityBadge({
  visibility,
}: {
  visibility: "public" | "private" | "invite";
}) {
  const meta = {
    public: { icon: GlobeIcon, label: "Public", className: "border-primary/10 bg-primary/5 text-primary" },
    invite: { icon: EnvelopeClosedIcon, label: "Invite only", className: "border-amber-200 bg-amber-50 text-amber-800" },
    private: { icon: LockClosedIcon, label: "Private", className: "" },
  }[visibility];
  const Icon = meta.icon;
  return (
    <Badge className={meta.className}>
      <Icon />
      {meta.label}
    </Badge>
  );
}
export function EventTable({
  events,
  filtered = false,
}: {
  events: Event[];
  filtered?: boolean;
}) {
  if (!events.length)
    return (
      <EmptyState
        filtered={filtered}
        title={filtered ? "No events match these filters" : undefined}
        description={
          filtered ? "Try a different search, date range, or tag." : undefined
        }
      />
    );
  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Date & time</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead>
                <span className="sr-only">View</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="max-w-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-md border bg-muted/40">
                      <span className="text-[9px] font-medium uppercase leading-none text-muted-foreground">
                        {formatDate(event.startsAt, {
                          month: "short",
                          day: undefined,
                          year: undefined,
                        })}
                      </span>
                      <span className="mt-1 text-base font-semibold leading-none">
                        {formatDate(event.startsAt, {
                          day: "2-digit",
                          month: undefined,
                          year: undefined,
                        })}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/events/${event.id}`}
                        className="line-clamp-1 font-medium hover:text-primary hover:underline"
                        title={event.title}
                      >
                        {event.title}
                      </Link>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {event.tags.length ? (
                          event.tags.map((tag) => (
                            <TagChip key={tag} tag={tag} />
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            By {event.creatorName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <p className="text-xs font-medium">
                    {formatDate(event.startsAt)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatTime(event.startsAt)} NPT
                  </p>
                </TableCell>
                <TableCell className="max-w-[180px]">
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {event.location}
                  </p>
                </TableCell>
                <TableCell>
                  <VisibilityBadge visibility={event.visibility} />
                </TableCell>
                <TableCell>
                  <Link
                    href={`/events/${event.id}`}
                    className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                    aria-label={`View ${event.title}`}
                  >
                    <ArrowRightIcon />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="divide-y md:hidden">
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/events/${event.id}`}
            className="block space-y-3 p-4 hover:bg-muted/40"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-medium">{event.title}</h3>
              <VisibilityBadge visibility={event.visibility} />
            </div>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarIcon />
              {formatDate(event.startsAt)} · {formatTime(event.startsAt)}
            </p>
            <p className="text-xs text-muted-foreground">{event.location}</p>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <PersonIcon />
              {event.creatorName}
              <ArrowRightIcon className="ml-auto" />
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
