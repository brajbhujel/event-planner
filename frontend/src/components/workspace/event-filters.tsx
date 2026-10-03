"use client";
import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { useEventFilters } from "@/store/event-filters";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function EventFilters({
  tags,
  initial,
}: {
  tags: string[];
  mine?: boolean;
  initial: {
    search: string;
    period: string;
    visibility: string;
    tag: string;
    sort: string;
  };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    search,
    period,
    visibility,
    tag,
    sort,
    setSearch,
    setPeriod,
    setVisibility,
    setTag,
    setSort,
    hydrate,
  } = useEventFilters();
  const hydrated = useRef(false);

  useEffect(() => {
    hydrate(initial);
    hydrated.current = true;
  }, [hydrate, initial.search, initial.period, initial.visibility, initial.tag, initial.sort]);

  const push = (next: Record<string, string>) => {
    const params = new URLSearchParams({
      search: next.search ?? search,
      period: next.period ?? period,
      visibility: next.visibility ?? visibility,
      tag: next.tag ?? tag,
      sort: next.sort ?? sort,
      page: "1",
    });
    if (!(next.search ?? search)) params.delete("search");
    if ((next.visibility ?? visibility) === "all") params.delete("visibility");
    if (!(next.tag ?? tag)) params.delete("tag");
    router.push(`${pathname}?${params}`);
  };

  useEffect(() => {
    if (!hydrated.current) return;
    const handle = setTimeout(() => {
      if (search === initial.search) return;
      push({ search });
    }, 400);
    return () => clearTimeout(handle);
  }, [search]);

  return (
    <div className="grid items-end gap-3 border-b bg-white p-4 sm:grid-cols-2 xl:grid-cols-[1.6fr_1fr_1fr_1fr] xl:p-5">
      <div className="space-y-1.5">
        <label htmlFor="search" className="text-xs font-medium text-muted-foreground">
          Search
        </label>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input
            id="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Title, description, or location"
            maxLength={120}
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Period</label>
        <Select
          value={period}
          onValueChange={(value) => {
            setPeriod(value);
            push({
              period: value,
              sort: value === "past" ? "date-desc" : "date-asc",
            });
            if (value === "past") setSort("date-desc");
            else setSort("date-asc");
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="past">Past</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Visibility</label>
        <Select
          value={visibility}
          onValueChange={(value) => {
            setVisibility(value);
            push({ visibility: value });
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="invite">Invite only</SelectItem>
            <SelectItem value="private">Private</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Tag</label>
        <Select
          value={tag || "__all"}
          onValueChange={(value) => {
            const next = value === "__all" ? "" : value;
            setTag(next);
            push({ tag: next });
          }}
        >
          <SelectTrigger className="w-full capitalize">
            <SelectValue placeholder="All tags" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All tags</SelectItem>
            {tags.map((t) => (
              <SelectItem key={t} value={t} className="capitalize">
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5 sm:col-span-2 xl:col-span-1">
        <label className="text-xs font-medium text-muted-foreground">Sort</label>
        <Select
          value={sort}
          onValueChange={(value) => {
            setSort(value);
            push({ sort: value });
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-asc">Date: earliest first</SelectItem>
            <SelectItem value="date-desc">Date: latest first</SelectItem>
            <SelectItem value="newest">Recently added</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
