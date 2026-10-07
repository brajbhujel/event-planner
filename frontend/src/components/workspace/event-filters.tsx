"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckIcon, ChevronDownIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

function TagFilter({
  tags,
  value,
  onChange,
}: {
  tags: string[];
  value: string;
  onChange: (tag: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tags;
    return tags.filter((tag) => tag.includes(q));
  }, [tags, query]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-9 w-full justify-between font-normal capitalize"
        >
          <span className={cn(!value && "text-muted-foreground")}>
            {value || "All tags"}
          </span>
          <ChevronDownIcon className="size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
        <div className="border-b p-2">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tags"
              className="h-8 pl-8"
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-56 overflow-y-auto p-1">
          <button
            type="button"
            className={cn(
              "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent",
              !value && "bg-accent",
            )}
            onClick={() => {
              onChange("");
              setOpen(false);
              setQuery("");
            }}
          >
            All tags
            {!value ? <CheckIcon className="size-4" /> : null}
          </button>
          {filtered.length === 0 ? (
            <p className="px-2 py-3 text-xs text-muted-foreground">No tags match</p>
          ) : (
            filtered.map((tag) => (
              <button
                key={tag}
                type="button"
                className={cn(
                  "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm capitalize hover:bg-accent",
                  value === tag && "bg-accent",
                )}
                onClick={() => {
                  onChange(tag);
                  setOpen(false);
                  setQuery("");
                }}
              >
                {tag}
                {value === tag ? <CheckIcon className="size-4" /> : null}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function EventFilters({
  tags,
  defaultPeriod = "all",
}: {
  tags: string[];
  defaultPeriod?: "all" | "upcoming" | "past";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const period = params.get("period") ?? defaultPeriod;
  const visibility = params.get("visibility") ?? "all";
  const tag = params.get("tag") ?? "";
  const sort = params.get("sort") ?? "date-asc";
  const searchParam = params.get("search") ?? "";

  const [search, setSearch] = useState(searchParam);

  useEffect(() => {
    setSearch(searchParam);
  }, [searchParam]);

  const push = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(changes).forEach(([key, value]) => {
      if (!value || (value === "all" && key === "visibility")) next.delete(key);
      else if (!value && (key === "search" || key === "tag")) next.delete(key);
      else next.set(key, value);
    });
    next.set("page", "1");
    router.push(`${pathname}?${next}`);
  };

  useEffect(() => {
    const handle = setTimeout(() => {
      if (search === searchParam) return;
      push({ search });
    }, 400);
    return () => clearTimeout(handle);
  }, [search]);

  return (
    <div className="grid items-end gap-3 border-b bg-white p-4 sm:grid-cols-2 xl:grid-cols-5 xl:p-5">
      <div className="space-y-1.5 xl:col-span-1">
        <label className="text-xs font-medium text-muted-foreground">Search</label>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Title, description, or location"
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Period</label>
        <Select
          value={period}
          onValueChange={(value) =>
            push({
              period: value,
              sort: value === "past" ? "date-desc" : "date-asc",
            })
          }
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
        <label className="text-xs font-medium text-muted-foreground">
          Event type
        </label>
        <Select
          value={visibility}
          onValueChange={(value) => push({ visibility: value })}
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
        <TagFilter tags={tags} value={tag} onChange={(value) => push({ tag: value })} />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Sort</label>
        <Select value={sort} onValueChange={(value) => push({ sort: value })}>
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
