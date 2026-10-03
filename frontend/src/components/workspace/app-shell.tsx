"use client";
import Link from "next/link";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HamburgerMenuIcon,
  PlusIcon,
} from "@radix-ui/react-icons";
import type { User } from "@/validations";
import { Brand } from "@/components/brand";
import { Navigation } from "./navigation";
import { UserMenu } from "./user-menu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useSidebar } from "@/store/sidebar";
import { cn, formatDate } from "@/lib/utils";

export function AppShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const { collapsed, mobileOpen, toggleCollapsed, setMobileOpen } = useSidebar();

  const sidebarInner = (
    <>
      <div className="flex h-[64px] items-center px-4">
        {collapsed ? (
          <Link href="/dashboard" className="mx-auto" aria-label="Gather home">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
              <CalendarIcon className="size-5" />
            </span>
          </Link>
        ) : (
          <Brand />
        )}
      </div>
      <div className="px-3 pb-3">
        {!collapsed && (
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Workspace
          </p>
        )}
        <Navigation collapsed={collapsed} onNavigate={() => setMobileOpen(false)} />
      </div>
      <div className="mt-auto p-3">
        <Button
          variant="ghost"
          size="sm"
          className="hidden w-full justify-start lg:flex"
          onClick={toggleCollapsed}
        >
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          {!collapsed && <span>Collapse</span>}
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-[100dvh]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-20 hidden flex-col border-r bg-white transition-[width] lg:flex",
          collapsed ? "w-[72px]" : "w-[236px]",
        )}
      >
        {sidebarInner}
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <div className="flex h-full flex-col">{sidebarInner}</div>
        </SheetContent>
      </Sheet>

      <div
        className={cn(
          "transition-[margin]",
          collapsed ? "lg:ml-[72px]" : "lg:ml-[236px]",
        )}
      >
        <header className="sticky top-0 z-10 flex h-[64px] items-center justify-between border-b bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <HamburgerMenuIcon />
            </Button>
            <div className="hidden items-center gap-2 text-sm sm:flex">
              <span className="text-muted-foreground">Workspace</span>
              <ChevronRightIcon className="size-3 text-muted-foreground" />
              <span>Events</span>
            </div>
            <div className="sm:hidden">
              <Brand />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/events/new">
                <PlusIcon />
                Create event
              </Link>
            </Button>
            <span className="hidden text-xs text-muted-foreground md:inline">
              {formatDate(new Date(), { weekday: "short" })}
            </span>
            <UserMenu user={user} />
          </div>
        </header>
        <main
          id="main-content"
          className="mx-auto max-w-[1440px] space-y-7 px-4 py-6 sm:px-7 lg:px-8 lg:py-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
