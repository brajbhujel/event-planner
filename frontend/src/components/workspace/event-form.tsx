"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  CalendarIcon,
  GlobeIcon,
  LockClosedIcon,
  CheckIcon,
  EnvelopeClosedIcon,
} from "@radix-ui/react-icons";
import { eventSchema, type Event, type FormState } from "@/validations";
import { z } from "zod";
import { toast } from "sonner";
import { saveEvent } from "@/lib/actions";
import { dateInput, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/field";
import { Calendar } from "@/components/ui/calendar";
import { TimePicker } from "@/components/ui/time-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function EventForm({ event }: { event?: Event }) {
  const formRef = useRef<HTMLFormElement>(null);
  const confirmedRef = useRef(false);
  const [state, action, pending] = useActionState(
    saveEvent.bind(null, event?.id ?? null),
    {} as FormState,
  );
  const [local, setLocal] = useState<FormState>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const errors = local.fields ?? state.fields;
  const initial = event
    ? dateInput(event.startsAt)
    : { date: "", time: "09:00" };
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [visibility, setVisibility] = useState(event?.visibility ?? "public");
  const selectedDate = date ? new Date(`${date}T12:00:00`) : undefined;

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error]);

  return (
    <>
      <form
        ref={formRef}
        action={action}
        className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]"
        onSubmit={(e) => {
          if (confirmedRef.current) {
            confirmedRef.current = false;
            return;
          }
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          form.set("date", date);
          form.set("time", time);
          form.set("visibility", visibility);
          const parsed = eventSchema.safeParse({
            ...Object.fromEntries(form),
            startsAt: `${date}T${time}:00+05:45`,
            tags: String(form.get("tags") ?? "")
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
            inviteEmails: String(form.get("inviteEmails") ?? "")
              .split(/[,\n]/)
              .map((t) => t.trim())
              .filter(Boolean),
          });
          if (!parsed.success) {
            setLocal({ fields: z.flattenError(parsed.error).fieldErrors });
            toast.error("Check the highlighted fields.");
            return;
          }
          setLocal({});
          setConfirmOpen(true);
        }}
      >
        <input type="hidden" name="date" value={date} />
        <input type="hidden" name="time" value={time} />
        <input type="hidden" name="visibility" value={visibility} />

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold">The essentials</h2>
            </CardHeader>
            <CardContent className="space-y-6">
              <Field id="title" label="Event name" error={errors?.title}>
                <Input
                  id="title"
                  name="title"
                  defaultValue={event?.title}
                  placeholder="e.g. Saturday design workshop"
                  minLength={3}
                  maxLength={120}
                  required
                />
              </Field>
              <Field
                id="description"
                label="About this event"
                error={errors?.description}
              >
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={event?.description}
                  placeholder="What should people know?"
                  minLength={10}
                  maxLength={5000}
                  required
                  rows={6}
                />
              </Field>
              <Field
                id="tags"
                label="Tags"
                hint="Comma-separated, up to 5."
                error={errors?.tags}
              >
                <Input
                  id="tags"
                  name="tags"
                  defaultValue={event?.tags.join(", ")}
                  placeholder="Workshop, Design"
                  maxLength={170}
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold">When & where</h2>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="date" label="Event date" error={errors?.startsAt}>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full justify-start font-normal",
                          !date && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 size-4" />
                        {date ? format(selectedDate!, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(d) => {
                          if (!d) return;
                          setDate(format(d, "yyyy-MM-dd"));
                        }}
                        captionLayout="dropdown"
                      />
                    </PopoverContent>
                  </Popover>
                </Field>
                <Field id="time" label="Start time" hint="Nepal Time (NPT)">
                  <TimePicker value={time} onChange={setTime} />
                </Field>
              </div>
              <Field id="location" label="Location" error={errors?.location}>
                <Input
                  id="location"
                  name="location"
                  defaultValue={event?.location}
                  placeholder="Venue or meeting link"
                  minLength={2}
                  maxLength={200}
                  required
                />
              </Field>
            </CardContent>
          </Card>

          {visibility === "invite" && (
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold">Invitees</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Emails of people who already have an account.
                </p>
              </CardHeader>
              <CardContent>
                <Field
                  id="inviteEmails"
                  label="Invite emails"
                  error={errors?.inviteEmails}
                >
                  <Textarea
                    id="inviteEmails"
                    name="inviteEmails"
                    defaultValue={event?.inviteEmails?.join("\n")}
                    placeholder={"friend@example.com\nother@example.com"}
                    rows={4}
                  />
                </Field>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-end gap-3 border-t pt-5">
            <Button asChild variant="outline">
              <Link href={event ? `/events/${event.id}` : "/events"}>
                Cancel
              </Link>
            </Button>
            <Button type="submit" disabled={pending}>
              <CheckIcon />
              {pending
                ? "Saving…"
                : event
                  ? "Save changes"
                  : "Create event"}
            </Button>
          </div>
        </div>

        <aside className="space-y-5">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold">Who can see this?</h2>
            </CardHeader>
            <CardContent>
              <fieldset className="space-y-3">
                {[
                  {
                    value: "public" as const,
                    title: "Public",
                    text: "Visible to everyone signed in.",
                    icon: GlobeIcon,
                  },
                  {
                    value: "invite" as const,
                    title: "Invite only",
                    text: "Only people you invite can see it.",
                    icon: EnvelopeClosedIcon,
                  },
                  {
                    value: "private" as const,
                    title: "Private",
                    text: "Only you. No attendees list.",
                    icon: LockClosedIcon,
                  },
                ].map(({ value, title, text, icon: Icon }) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-checked:border-primary/50 has-checked:bg-primary/5"
                  >
                    <input
                      type="radio"
                      name="visibility_ui"
                      value={value}
                      checked={visibility === value}
                      onChange={() => setVisibility(value)}
                      className="mt-1 accent-primary"
                    />
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Icon />
                        {title}
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                        {text}
                      </p>
                    </div>
                  </label>
                ))}
              </fieldset>
            </CardContent>
          </Card>
        </aside>
      </form>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>
            {event ? "Save these changes?" : "Create this event?"}
          </AlertDialogTitle>
          <AlertDialogDescription className="mt-2 text-sm text-muted-foreground">
            {event
              ? "Your updates will replace the current event details."
              : "This will publish the event with the details you entered."}
          </AlertDialogDescription>
          <div className="mt-6 flex justify-end gap-2">
            <AlertDialogCancel asChild>
              <Button variant="outline">Cancel</Button>
            </AlertDialogCancel>
            <Button
              disabled={pending}
              onClick={() => {
                confirmedRef.current = true;
                setConfirmOpen(false);
                formRef.current?.requestSubmit();
              }}
            >
              Confirm
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
