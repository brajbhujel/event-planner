import type { Attendee } from "@/validations";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { initials } from "@/lib/utils";

const labels: Record<Attendee["status"], string> = {
  yes: "Going",
  no: "Can’t go",
  maybe: "Maybe",
  pending: "Pending",
};

export function AttendeesList({
  attendees,
  visibility,
}: {
  attendees: Attendee[] | null;
  visibility: "public" | "private" | "invite";
}) {
  if (visibility === "private") {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold">Attendees</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Private events don’t have an attendees list.
          </p>
        </CardContent>
      </Card>
    );
  }

  const list = attendees ?? [];

  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-semibold">
          {visibility === "invite" ? "Invitees" : "Attendees"}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {visibility === "invite"
            ? "Everyone invited and their response."
            : "People who responded to this event."}
        </p>
      </CardHeader>
      <CardContent>
        {!list.length ? (
          <p className="text-sm text-muted-foreground">
            {visibility === "invite"
              ? "No invitees yet."
              : "No responses yet."}
          </p>
        ) : (
          <ul className="divide-y">
            {list.map((person) => (
              <li
                key={person.userId}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/8 text-xs font-medium text-primary">
                    {initials(person.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{person.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {person.email}
                    </p>
                  </div>
                </div>
                <Badge
                  className={
                    person.status === "pending"
                      ? "bg-muted text-muted-foreground"
                      : person.status === "yes"
                        ? "border-primary/10 bg-primary/5 text-primary"
                        : ""
                  }
                >
                  {labels[person.status]}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
