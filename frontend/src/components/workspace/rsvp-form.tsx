"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import type { Event } from "@/validations";
import { ApiError } from "@/config/api";
import { eventsService } from "@/services/events.service";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Button } from "@/components/ui/button";

export function RsvpForm({ event, past }: { event: Event; past: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (event.visibility === "private") return null;

  return (
    <div>
      <h3 className="text-sm font-semibold">Will you be there?</h3>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {past
          ? "This event has passed. RSVPs are closed."
          : "Let the organizer know your plans."}
      </p>
      <div className="mt-4 flex gap-2">
        {(
          [
            { status: "yes", label: "Going" },
            { status: "maybe", label: "Maybe" },
            { status: "no", label: "Can’t go" },
          ] as const
        ).map(({ status, label }) => (
          <Button
            key={status}
            type="button"
            size="sm"
            variant={event.rsvp === status ? "default" : "outline"}
            aria-pressed={event.rsvp === status}
            disabled={pending || past}
            onClick={() =>
              startTransition(async () => {
                try {
                  await eventsService.rsvp(event.id, status);
                  useWorkspaceStore.getState().invalidate();
                  toast.success("RSVP updated");
                  router.refresh();
                } catch (error) {
                  toast.error(
                    error instanceof ApiError
                      ? error.message
                      : "Could not update RSVP.",
                  );
                }
              })
            }
          >
            {label}
          </Button>
        ))}
      </div>
      {pending && (
        <p role="status" className="mt-3 text-xs text-muted-foreground">
          Saving…
        </p>
      )}
      {event.rsvp && !pending && (
        <p role="status" className="mt-3 text-xs text-muted-foreground">
          Your response:{" "}
          {event.rsvp === "yes"
            ? "Going"
            : event.rsvp === "no"
              ? "Can’t go"
              : "Maybe"}
        </p>
      )}
    </div>
  );
}
