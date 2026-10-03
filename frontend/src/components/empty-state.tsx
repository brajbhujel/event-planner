import { CalendarIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { Button } from "./ui/button";
export function EmptyState({
  title = "Your next gathering starts here",
  description = "Create your first event and bring people together.",
  filtered = false,
}: {
  title?: string;
  description?: string;
  filtered?: boolean;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="mb-5 flex size-14 items-center justify-center rounded-xl border border-border bg-muted/60">
        <CalendarIcon className="size-6 text-primary" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      <Button
        asChild
        className="mt-6"
        variant={filtered ? "outline" : "default"}
      >
        <Link href={filtered ? "/events?period=all" : "/events/new"}>
          {filtered ? "Clear filters" : "Create an event"}
        </Link>
      </Button>
    </div>
  );
}
