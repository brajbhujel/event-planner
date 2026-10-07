"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TrashIcon } from "@radix-ui/react-icons";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/config/api";
import { eventsService } from "@/services/events.service";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

export function DeleteEvent({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="text-destructive">
          <TrashIcon />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle className="text-lg font-semibold">
          Delete this event?
        </AlertDialogTitle>
        <AlertDialogDescription className="mt-3 text-sm leading-relaxed text-muted-foreground">
          “{title}” and its RSVPs/invites will be permanently removed.
        </AlertDialogDescription>
        <div className="mt-6 flex justify-end gap-3">
          <AlertDialogCancel asChild>
            <Button variant="outline" type="button" disabled={pending}>
              Keep event
            </Button>
          </AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await eventsService.remove(id);
                  useWorkspaceStore.getState().invalidate();
                  toast.success("Event deleted.");
                  setOpen(false);
                  router.push("/events");
                } catch (error) {
                  toast.error(
                    error instanceof ApiError
                      ? error.message
                      : "Could not delete event.",
                  );
                }
              })
            }
          >
            {pending ? "Deleting…" : "Delete event"}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
