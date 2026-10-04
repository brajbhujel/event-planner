"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import {
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@radix-ui/react-icons";
import { listSchema } from "@/validations";
import { loadEventsAction, loadTagsAction } from "@/lib/load-data";
import {
  eventsCacheKey,
  useWorkspaceStore,
} from "@/stores/workspace-store";
import { PageHeading } from "@/components/page-heading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EventTable } from "./event-table";
import { EventFilters } from "./event-filters";

function ListSkeleton() {
  return (
    <div className="space-y-3 p-5" role="status" aria-label="Loading events">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-12 animate-pulse rounded-md bg-muted" />
      ))}
      <span className="sr-only">Loading events…</span>
    </div>
  );
}

export function EventListPage({ mine = false }: { mine?: boolean }) {
  const searchParams = useSearchParams();
  const eventsByKey = useWorkspaceStore((s) => s.eventsByKey);
  const tags = useWorkspaceStore((s) => s.tags);
  const setEvents = useWorkspaceStore((s) => s.setEvents);
  const setTags = useWorkspaceStore((s) => s.setTags);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filters = useMemo(() => {
    const raw = Object.fromEntries(
      [...searchParams.entries()].filter(([, value]) => value !== ""),
    );
    const parsed = listSchema.safeParse({
      ...raw,
      mine: String(mine),
      ...(mine && !raw.period ? { period: "all" } : {}),
    });
    return parsed.success
      ? parsed.data
      : listSchema.parse({
          mine: String(mine),
          period: mine ? "all" : "upcoming",
        });
  }, [searchParams, mine]);

  const query = useMemo(() => {
    const params = new URLSearchParams(
      Object.entries(filters).map(([key, value]) => [key, String(value)]),
    );
    return params;
  }, [filters]);

  const cacheKey = eventsCacheKey(query);
  const cached = eventsByKey[cacheKey] ?? null;
  const base = mine ? "/my-events" : "/events";

  useEffect(() => {
    if (cached && tags) return;

    let cancelled = false;
    startTransition(async () => {
      try {
        setError(null);
        const jobs: Promise<void>[] = [];
        if (!cached) {
          jobs.push(
            loadEventsAction(Object.fromEntries(query)).then((result) => {
              if (!cancelled) {
                setEvents(cacheKey, {
                  data: result.data,
                  pagination: result.pagination,
                });
              }
            }),
          );
        }
        if (!tags) {
          jobs.push(
            loadTagsAction().then((list) => {
              if (!cancelled) setTags(list);
            }),
          );
        }
        await Promise.all(jobs);
      } catch {
        if (!cancelled) setError("Could not load events. Try again.");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [cacheKey, cached, tags, query, setEvents, setTags]);

  const href = (changes: Record<string, string>) => {
    const next = new URLSearchParams(query);
    next.delete("mine");
    Object.entries(changes).forEach(([key, value]) => next.set(key, value));
    return `${base}?${next}`;
  };

  const showSkeleton = !cached;
  const { page, pageSize, total, totalPages } = cached?.pagination ?? {
    page: 1,
    pageSize: 8,
    total: 0,
    totalPages: 1,
  };
  const filtered = Boolean(
    filters.search ||
      filters.tag ||
      filters.visibility !== "all" ||
      filters.period !== "all",
  );

  return (
    <>
      <PageHeading
        eyebrow={mine ? "Your plans" : "Browse"}
        title={mine ? "My events" : "All events"}
        description={
          mine
            ? "Events you organized."
            : "Public and invite events you can access."
        }
        action={
          <Button asChild>
            <Link href="/events/new">
              <PlusIcon />
              Create event
            </Link>
          </Button>
        }
      />
      <Card className="overflow-hidden">
        <EventFilters tags={tags ?? []} defaultPeriod={mine ? "all" : "upcoming"} />
        {error ? (
          <p className="px-5 py-8 text-sm text-destructive">{error}</p>
        ) : showSkeleton || (pending && !cached) ? (
          <ListSkeleton />
        ) : (
          <>
            <EventTable events={cached.data} filtered={filtered} />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4">
              <p className="text-xs text-muted-foreground">
                {total
                  ? `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`
                  : "No events"}
              </p>
              <nav aria-label="Pagination" className="flex items-center gap-2">
                {page > 1 ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href={href({ page: String(page - 1) })}>
                      <ChevronLeftIcon />
                      Previous
                    </Link>
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" disabled>
                    <ChevronLeftIcon />
                    Previous
                  </Button>
                )}
                <span className="px-2 text-xs tabular-nums text-muted-foreground">
                  {page} / {totalPages}
                </span>
                {page < totalPages ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href={href({ page: String(page + 1) })}>
                      Next
                      <ChevronRightIcon />
                    </Link>
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" disabled>
                    Next
                    <ChevronRightIcon />
                  </Button>
                )}
              </nav>
            </div>
          </>
        )}
      </Card>
    </>
  );
}
