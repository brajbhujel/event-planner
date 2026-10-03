import Link from "next/link";
import {
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@radix-ui/react-icons";
import { getEvents, getTags } from "@/lib/data";
import { listSchema } from "@/validations";
import { PageHeading } from "@/components/page-heading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EventTable } from "./event-table";
import { EventFilters } from "./event-filters";
import { DeletedToast } from "./deleted-toast";

export type SearchParams = Record<string, string | string[] | undefined>;

export async function EventListPage({
  searchParams,
  mine = false,
}: {
  searchParams: SearchParams;
  mine?: boolean;
}) {
  const raw = Object.fromEntries(
    Object.entries(searchParams).filter(
      ([, value]) => typeof value === "string",
    ),
  );
  const parsed = listSchema.safeParse({
    ...raw,
    mine: String(mine),
    ...(mine && !raw.period ? { period: "all" } : {}),
  });
  const filters = parsed.success
    ? parsed.data
    : listSchema.parse({
        mine: String(mine),
        period: mine ? "all" : "upcoming",
      });
  const query = new URLSearchParams(
    Object.entries(filters).map(([key, value]) => [key, String(value)]),
  );
  const [result, tags] = await Promise.all([getEvents(query), getTags()]);
  const base = mine ? "/my-events" : "/events";
  const href = (changes: Record<string, string>) => {
    const next = new URLSearchParams(query);
    next.delete("mine");
    Object.entries(changes).forEach(([key, value]) => next.set(key, value));
    return `${base}?${next}`;
  };
  const { page, pageSize, total, totalPages } = result.pagination;
  const filtered = Boolean(
    filters.search ||
      filters.tag ||
      filters.visibility !== "all" ||
      filters.period !== "all",
  );

  return (
    <>
      <DeletedToast notice={searchParams.notice} />
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
        <EventFilters
          tags={tags}
          mine={mine}
          initial={{
            search: filters.search,
            period: filters.period,
            visibility: filters.visibility,
            tag: filters.tag,
            sort: filters.sort,
          }}
        />
        <EventTable events={result.data} filtered={filtered} />
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
      </Card>
    </>
  );
}
