import Link from "next/link";
import {
  PlusIcon,
  ArrowRightIcon,
  CalendarIcon,
  CounterClockwiseClockIcon,
  PersonIcon,
  LockClosedIcon,
  ClockIcon,
} from "@radix-ui/react-icons";
import { requireUser } from "@/lib/auth";
import { getDashboard } from "@/lib/data";
import { formatDate, formatTime } from "@/lib/utils";
import { PageHeading } from "@/components/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EventTable, VisibilityBadge } from "./event-table";

export async function DashboardPage() {
  const [user, data] = await Promise.all([requireUser(), getDashboard()]);
  const stats = [
    {
      label: "Upcoming",
      value: data.upcoming,
      icon: CalendarIcon,
      href: "/events",
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
        description="What’s coming up and what you’ve organized."
        action={
          <Button asChild>
            <Link href="/events/new">
              <PlusIcon />
              Create event
            </Link>
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
          <EventTable events={data.recent} />
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
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Create your first event to get started.
                </p>
                <Link
                  href="/events/new"
                  className="mt-auto flex items-center justify-between pt-5 text-xs font-semibold text-primary"
                >
                  Plan an event
                  <ArrowRightIcon />
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
