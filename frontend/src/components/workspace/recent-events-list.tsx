"use client";

import Link from "next/link";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import type { Event } from "@/validations";
import { formatDate, formatTime } from "@/lib/utils";
import { InvitedBadge, VisibilityBadge, isInvitedFor } from "./event-table";
import { useWorkspaceUser } from "./user-context";

export function RecentEventsList({ events }: { events: Event[] }) {
  const user = useWorkspaceUser();

  if (!events.length) {
    return (
      <p className="px-5 py-8 text-xs text-muted-foreground">
        No recent events yet.
      </p>
    );
  }

  return (
    <ul className="divide-y">
      {events.slice(0, 5).map((event) => (
        <li key={event.id}>
          <Link
            href={`/events/${event.id}`}
            className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-muted/40"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-medium leading-tight">
                  {event.title}
                </p>
                <VisibilityBadge visibility={event.visibility} />
                {isInvitedFor(user.id, event) ? <InvitedBadge /> : null}
              </div>
              {event.description ? (
                <p className="line-clamp-1 text-[11px] leading-snug text-muted-foreground">
                  {event.description}
                </p>
              ) : null}
              <p className="text-[11px] text-muted-foreground">
                {formatDate(event.startsAt)} · {formatTime(event.startsAt)} NPT
                {event.location ? ` · ${event.location}` : ""}
              </p>
            </div>
            <ArrowRightIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
