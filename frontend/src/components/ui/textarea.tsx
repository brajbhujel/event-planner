import * as React from "react";
import { cn } from "@/lib/utils";
export function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-32 w-full rounded-md border border-input bg-white px-3 py-2 text-sm leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/15 placeholder:text-muted-foreground/70 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}
