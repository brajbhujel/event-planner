"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { User } from "@/validations";
import { Brand } from "@/components/brand";
import { UserMenu } from "./user-menu";
import { UserProvider } from "./user-context";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/events", label: "All events", icon: CalendarDays },
  { href: "/my-events", label: "My events", icon: UserRound },
];

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  const { isMobile, setOpenMobile } = useSidebar();
  return (
    <SidebarMenuButton asChild isActive={active} tooltip={label}>
      <Link
        href={href}
        onClick={() => {
          if (isMobile) setOpenMobile(false);
        }}
      >
        <Icon />
        <span>{label}</span>
      </Link>
    </SidebarMenuButton>
  );
}

function AppSidebar() {
  const pathname = usePathname();
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5 group-data-[collapsible=icon]:justify-center">
          <Brand className="group-data-[collapsible=icon]:hidden" />
          <span className="hidden size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground group-data-[collapsible=icon]:flex">
            <CalendarDays className="size-4" />
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map(({ href, label, icon }) => {
                const active =
                  href === "/events"
                    ? pathname.startsWith("/events")
                    : pathname === href;
                return (
                  <SidebarMenuItem key={href}>
                    <NavLink
                      href={href}
                      label={label}
                      icon={icon}
                      active={active}
                    />
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <NavLink
              href="/profile"
              label="Profile"
              icon={UserRound}
              active={pathname === "/profile"}
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export function AppShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  return (
    <UserProvider user={user}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-1 h-4" />
              <span className="text-sm text-muted-foreground">Event planner</span>
            </div>
            <UserMenu user={user} />
          </header>
          <main className="mx-auto w-full max-w-[1440px] flex-1 space-y-7 px-4 py-6 sm:px-7 lg:px-8">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </UserProvider>
  );
}
