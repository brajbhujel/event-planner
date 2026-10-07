"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PersonIcon, ExitIcon } from "@radix-ui/react-icons";
import type { User } from "@/validations";
import { initials } from "@/lib/utils";
import { authService } from "@/services/auth.service";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function UserMenu({ user }: { user: User }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            aria-label="Account menu"
          >
            <Avatar className="size-9 border">
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs font-normal text-muted-foreground">
              {user.email}
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => router.push("/profile")}
            className="cursor-pointer"
          >
            <PersonIcon />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            className="cursor-pointer"
            onSelect={(e) => {
              e.preventDefault();
              setConfirmOpen(true);
            }}
          >
            <ExitIcon />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Log out?</AlertDialogTitle>
          <AlertDialogDescription className="mt-2 text-sm text-muted-foreground">
            You’ll need to sign in again to manage your events.
          </AlertDialogDescription>
          <div className="mt-6 flex justify-end gap-2">
            <AlertDialogCancel asChild>
              <Button variant="outline" disabled={pending}>
                Cancel
              </Button>
            </AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await authService.logout();
                  useWorkspaceStore.getState().invalidate();
                  router.replace("/login");
                })
              }
            >
              {pending ? "Logging out…" : "Log out"}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
