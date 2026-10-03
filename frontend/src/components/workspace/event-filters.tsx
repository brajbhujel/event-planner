"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function EventFilters({ tags }: { tags: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const period = params.get("period") ?? "upcoming";
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
        <Select
          value={tag || "__all"}
          onValueChange={(value) =>
            push({ tag: value === "__all" ? "" : value })
          }
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
