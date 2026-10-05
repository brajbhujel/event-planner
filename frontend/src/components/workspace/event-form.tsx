"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, startOfDay } from "date-fns";
import {
  CalendarIcon,
  GlobeIcon,
  LockClosedIcon,
  CheckIcon,
  EnvelopeClosedIcon,
} from "@radix-ui/react-icons";
import { eventSchema, type Event, type FormState } from "@/validations";
import { z } from "zod";
import toast from "react-hot-toast";
import { saveEvent } from "@/lib/actions";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { dateInput, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/field";
import { Calendar } from "@/components/ui/calendar";
import { TimePicker } from "@/components/ui/time-picker";
import { TagInput } from "@/components/tag-input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function DateField({
  label,
  value,
  onChange,
  error,
  minDate,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string[];
  minDate?: Date;
}) {
  const selected = value ? new Date(`${value}T12:00:00`) : undefined;
  return (
    <Field id={label} label={label} error={error}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start font-normal",
              !value && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 size-4" />
            {value ? format(selected!, "PPP") : "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(d) => d && onChange(format(d, "yyyy-MM-dd"))}
            disabled={minDate ? { before: minDate } : undefined}
            captionLayout="dropdown"
          />
        </PopoverContent>
      </Popover>
    </Field>
  );
}

export function EventForm({ event }: { event?: Event }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const confirmedRef = useRef(false);
  const [state, action, pending] = useActionState(
    saveEvent.bind(null, event?.id ?? null),
    {} as FormState,
  );
  const [local, setLocal] = useState<FormState>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const errors = local.fields ?? state.fields;

  const initial = useMemo(() => {
    const start = event ? dateInput(event.startsAt) : { date: "", time: "09:00" };
    const end = event?.endsAt
      ? dateInput(event.endsAt)
      : { date: "", time: "17:00" };
    return {
      title: event?.title ?? "",
      description: event?.description ?? "",
      location: event?.location ?? "",
      date: start.date,
      time: start.time,
      endDate: end.date,
      endTime: end.time,
      multiDay: Boolean(event?.endsAt),
      visibility: event?.visibility ?? ("public" as const),
      tags: event?.tags ?? [],
      inviteEmails: event?.inviteEmails ?? [],
    };
  }, [event]);

  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [location, setLocation] = useState(initial.location);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [endDate, setEndDate] = useState(initial.endDate);
  const [endTime, setEndTime] = useState(initial.endTime);
  const [multiDay, setMultiDay] = useState(initial.multiDay);
  const [visibility, setVisibility] = useState(initial.visibility);
  const [tags, setTags] = useState<string[]>(initial.tags);
  const [inviteEmails, setInviteEmails] = useState<string[]>(
    initial.inviteEmails,
  );

  const dirty =
    title !== initial.title ||
    description !== initial.description ||
    location !== initial.location ||
    date !== initial.date ||
    time !== initial.time ||
    endDate !== initial.endDate ||
    endTime !== initial.endTime ||
    multiDay !== initial.multiDay ||
    visibility !== initial.visibility ||
    tags.join(",") !== initial.tags.join(",") ||
    inviteEmails.join(",") !== initial.inviteEmails.join(",");

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success && state.id) {
      useWorkspaceStore.getState().invalidate();
      toast.success(state.success);
      router.push(`/events/${state.id}`);
    }
  }, [state, router]);

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
          const parsed = eventSchema.safeParse({
            title,
            description,
            location,
            visibility,
            startsAt: `${date}T${time}:00+05:45`,
            endsAt:
              multiDay && endDate ? `${endDate}T${endTime}:00+05:45` : null,
            tags,
            inviteEmails,
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
        <input type="hidden" name="multiDay" value={String(multiDay)} />
        <input type="hidden" name="endDate" value={endDate} />
        <input type="hidden" name="endTime" value={endTime} />
        <input type="hidden" name="visibility" value={visibility} />
        <input type="hidden" name="tags" value={tags.join(",")} />
        <input type="hidden" name="inviteEmails" value={inviteEmails.join(",")} />
        <input type="hidden" name="title" value={title} />
        <input type="hidden" name="description" value={description} />
        <input type="hidden" name="location" value={location} />

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold">The essentials</h2>
            </CardHeader>
            <CardContent className="space-y-6">
              <Field id="title" label="Event name" error={errors?.title}>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Saturday design workshop"
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
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={6}
                />
              </Field>
              <Field
                id="tags"
                label="Tags"
                hint="Up to 5. Type and press comma."
                error={errors?.tags}
              >
                <TagInput
                  value={tags}
                  onChange={setTags}
                  max={5}
                  placeholder="workshop, design"
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold">When & where</h2>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Duration
                </label>
                <Select
                  value={multiDay ? "multi" : "single"}
                  onValueChange={(v) => setMultiDay(v === "multi")}
                >
                  <SelectTrigger className="w-full sm:w-[220px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">One day</SelectItem>
                    <SelectItem value="multi">Multi day</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <DateField
                  label={multiDay ? "Start date" : "Event date"}
                  value={date}
                  onChange={setDate}
                  error={errors?.startsAt}
                  minDate={startOfDay(new Date())}
                />
                <Field id="time" label="Start time" hint="Nepal Time (NPT)">
                  <TimePicker value={time} onChange={setTime} />
                </Field>
              </div>

              {multiDay ? (
                <div className="grid gap-5 sm:grid-cols-2">
                  <DateField
                    label="End date"
                    value={endDate}
                    onChange={setEndDate}
                    error={errors?.endsAt}
                    minDate={
                      date
                        ? startOfDay(new Date(`${date}T12:00:00`))
                        : startOfDay(new Date())
                    }
                  />
                  <Field id="endTime" label="End time">
                    <TimePicker value={endTime} onChange={setEndTime} />
                  </Field>
                </div>
              ) : null}

              <Field id="location" label="Location" error={errors?.location}>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </Field>
            </CardContent>
          </Card>

          {visibility === "invite" ? (
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold">Invitees</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  People who already have an account. Type email and press comma.
                </p>
              </CardHeader>
              <CardContent>
                <Field
                  id="inviteEmails"
                  label="Invite emails"
                  error={errors?.inviteEmails}
                >
                  <TagInput
                    value={inviteEmails}
                    onChange={setInviteEmails}
                    max={20}
                    placeholder="friend@example.com"
                    capitalize={false}
                  />
                </Field>
              </CardContent>
            </Card>
          ) : null}

          <div className="flex items-center justify-end gap-3 border-t pt-5">
            <Button asChild variant="outline">
              <Link href={event ? `/events/${event.id}` : "/events"}>Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={pending || (Boolean(event) && !dirty)}
            >
              <CheckIcon />
              {pending ? "Saving…" : event ? "Save changes" : "Create event"}
            </Button>
          </div>
        </div>

        <aside>
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold">Who can see this?</h2>
            </CardHeader>
            <CardContent>
              <fieldset className="space-y-3">
                {(
                  [
                    {
                      value: "public" as const,
                      title: "Public",
                      text: "Visible to everyone signed in.",
                      icon: GlobeIcon,
                    },
                    {
                      value: "invite" as const,
                      title: "Invite only",
                      text: "Only people you invite.",
                      icon: EnvelopeClosedIcon,
                    },
                    {
                      value: "private" as const,
                      title: "Private",
                      text: "Only you. No attendees.",
                      icon: LockClosedIcon,
                    },
                  ] as const
                ).map(({ value, title, text, icon: Icon }) => (
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
                      <p className="mt-1.5 text-xs text-muted-foreground">{text}</p>
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
            Confirm to continue.
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
