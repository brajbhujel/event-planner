"use client";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TrashIcon } from "@radix-ui/react-icons";
import toast from "react-hot-toast";
import type { FormState } from "@/validations";
import { removeEvent } from "@/lib/actions";
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
  const [state, action, pending] = useActionState(
    removeEvent.bind(null, id),
    {} as FormState,
  );

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) {
      toast.success(state.success);
      router.push("/events");
    }
  }, [state.error, state.success, router]);

  return (
    <AlertDialog>
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
        <form action={action} className="mt-6 flex justify-end gap-3">
          <AlertDialogCancel asChild>
            <Button variant="outline" type="button" disabled={pending}>
              Keep event
            </Button>
          </AlertDialogCancel>
          <Button variant="destructive" disabled={pending}>
            {pending ? "Deleting…" : "Delete event"}
          </Button>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
