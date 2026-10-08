"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { PlusIcon } from "@radix-ui/react-icons";
import { listSchema } from "@/validations";
import {
  eventsCacheKey,
  useWorkspaceStore,
} from "@/stores/workspace-store";
import { PageHeading } from "@/components/page-heading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/pagination";
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
  const error = useWorkspaceStore((s) => s.error);
  const loadEvents = useWorkspaceStore((s) => s.loadEvents);
  const loadTags = useWorkspaceStore((s) => s.loadTags);

  const filters = useMemo(() => {
    const raw = Object.fromEntries(
      [...searchParams.entries()].filter(([, value]) => value !== ""),
    );
    const parsed = listSchema.safeParse({
      ...raw,
      mine: String(mine),
      ...(!raw.period ? { period: "all" } : {}),
    });
    return parsed.success
      ? parsed.data
      : listSchema.parse({
          mine: String(mine),
          period: "all",
        });
  }, [searchParams, mine]);

  const query = useMemo(() => {
    return new URLSearchParams(
      Object.entries(filters).map(([key, value]) => [key, String(value)]),
    );
  }, [filters]);

  const cacheKey = eventsCacheKey(query);
  const cached = eventsByKey[cacheKey] ?? null;
  const base = mine ? "/my-events" : "/events";

  useEffect(() => {
    void loadEvents(query);
    void loadTags();
  }, [query, loadEvents, loadTags]);

  const href = (changes: Record<string, string>) => {
    const next = new URLSearchParams(query);
    next.delete("mine");
    Object.entries(changes).forEach(([key, value]) => next.set(key, value));
    return `${base}?${next}`;
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
        <EventFilters tags={tags ?? []} defaultPeriod="all" />
        {error && !cached ? (
          <p className="px-5 py-8 text-sm text-destructive">{error}</p>
        ) : !cached ? (
          <ListSkeleton />
        ) : (
          <>
            <EventTable events={cached.data} filtered={filtered} />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4">
              <p className="text-xs text-muted-foreground">
                {cached.pagination.total
                  ? `Showing ${(cached.pagination.page - 1) * cached.pagination.pageSize + 1}–${Math.min(cached.pagination.page * cached.pagination.pageSize, cached.pagination.total)} of ${cached.pagination.total}`
                  : "No events"}
              </p>
              <Pagination
                page={cached.pagination.page}
                totalPages={cached.pagination.totalPages}
                previousHref={
                  cached.pagination.page > 1
                    ? href({ page: String(cached.pagination.page - 1) })
                    : undefined
                }
                nextHref={
                  cached.pagination.page < cached.pagination.totalPages
                    ? href({ page: String(cached.pagination.page + 1) })
                    : undefined
                }
              />
            </div>
          </>
        )}
      </Card>
    </>
  );
}
