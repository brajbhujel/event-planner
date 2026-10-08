"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  ArrowRightIcon,
  CalendarIcon,
  CounterClockwiseClockIcon,
  PersonIcon,
  LockClosedIcon,
  EnvelopeClosedIcon,
  ClockIcon,
} from "@radix-ui/react-icons";
import { formatDate, formatTime } from "@/lib/utils";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useWorkspaceUser } from "./user-context";
import { PageHeading } from "@/components/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { VisibilityBadge } from "./event-table";
import { RecentEventsList } from "./recent-events-list";

function DashboardSkeleton() {
  return (
    <div className="space-y-7" role="status" aria-label="Loading dashboard">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg border bg-muted/60" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="h-96 animate-pulse rounded-lg border bg-muted/60" />
        <div className="h-96 animate-pulse rounded-lg border bg-muted/60" />
      </div>
      <span className="sr-only">Loading dashboard…</span>
    </div>
  );
}

export function DashboardPage() {
  const user = useWorkspaceUser();
  const data = useWorkspaceStore((s) => s.dashboard);
  const error = useWorkspaceStore((s) => s.error);
  const loadDashboard = useWorkspaceStore((s) => s.loadDashboard);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  if (error && !data) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (!data) {
    return (
      <>
        <PageHeading
          eyebrow="Overview"
          title={`Hello, ${user.name.split(" ")[0]}.`}
          description="What’s coming up and what you’ve been invited to."
        />
        <DashboardSkeleton />
      </>
    );
  }

  const stats = [
    {
      label: "Upcoming",
      value: data.upcoming,
      icon: CalendarIcon,
      href: "/events?period=upcoming",
    },
    {
      label: "Past",
      value: data.past,
      icon: CounterClockwiseClockIcon,
      href: "/events?period=past&sort=date-desc",
    },
    {
      label: "My events",
      value: data.mine,
      icon: PersonIcon,
      href: "/my-events",
    },
    {
      label: "Invites",
      value: data.invited,
      icon: EnvelopeClosedIcon,
      href: "/events?visibility=invite&period=all",
    },
    {
      label: "Private",
      value: data.private,
      icon: LockClosedIcon,
      href: "/events?visibility=private&period=all",
    },
  ];

  return (
    <>
      <PageHeading
        eyebrow="Overview"
        title={`Hello, ${user.name.split(" ")[0]}.`}
        description="What’s coming up and what you’ve been invited to."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href} className="rounded-lg">
            <Card className="h-full border-l-[3px] border-l-primary/75 hover:border-primary/40">
              <CardContent className="px-5 py-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    {label}
                  </p>
                  <span className="flex size-8 items-center justify-center rounded-md bg-primary/5 text-primary">
                    <Icon className="size-4" />
                  </span>
                </div>
                <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">
                  {value}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Recently added</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Latest events in your workspace
              </p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/events?period=all&sort=newest">
                View all
                <ArrowRightIcon />
              </Link>
            </Button>
          </CardHeader>
          <RecentEventsList events={data.recent} />
        </Card>
        <Card className="flex flex-col">
          <CardHeader>
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <ClockIcon className="text-primary" />
              Up next
            </h2>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            {data.nextEvent ? (
              <>
                <VisibilityBadge visibility={data.nextEvent.visibility} />
                <h3 className="mt-4 text-xl font-semibold tracking-tight">
                  {data.nextEvent.title}
                </h3>
                <p className="mt-3 text-xs text-muted-foreground">
                  {formatDate(data.nextEvent.startsAt)} ·{" "}
                  {formatTime(data.nextEvent.startsAt)} NPT
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {data.nextEvent.location}
                </p>
                <Link
                  href={`/events/${data.nextEvent.id}`}
                  className="mt-auto flex items-center justify-between border-t pt-4 text-xs font-medium text-primary"
                >
                  View event
                  <ArrowRightIcon />
                </Link>
              </>
            ) : (
              <>
                <span className="mb-4 flex size-10 items-center justify-center rounded-lg border bg-muted/40">
                  <CalendarIcon className="size-5 text-muted-foreground" />
                </span>
                <h3 className="text-base font-semibold">No upcoming events</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Create an event from All events when you’re ready.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
