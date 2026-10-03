"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DashboardIcon,
  CalendarIcon,
  PersonIcon,
  PlusIcon,
} from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Overview", icon: DashboardIcon },
  { href: "/events", label: "All events", icon: CalendarIcon },
  { href: "/my-events", label: "My events", icon: PersonIcon },
];

export function Navigation({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-1">
      {items.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/events"
            ? pathname.startsWith("/events")
            : pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            title={label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
              active && "bg-primary/8 text-primary",
              collapsed && "justify-center px-2",
            )}
          >
            <Icon className="size-[18px] shrink-0" />
            {!collapsed && label}
          </Link>
        );
      })}
      <Link
        href="/events/new"
        onClick={onNavigate}
        className={cn(
          "mt-2 flex items-center gap-2.5 rounded-md bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground",
          collapsed && "justify-center px-2",
        )}
      >
        <PlusIcon className="size-[18px]" />
        {!collapsed && "Create event"}
      </Link>
    </nav>
  );
}
