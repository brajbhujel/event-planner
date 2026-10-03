import { cn } from "@/lib/utils";
export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="relative w-full overflow-x-auto">
      <table
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}
export function TableHeader(props: React.ComponentProps<"thead">) {
  return (
    <thead
      className="bg-muted/45 text-left text-xs text-muted-foreground"
      {...props}
    />
  );
}
export function TableBody(props: React.ComponentProps<"tbody">) {
  return <tbody className="divide-y divide-border" {...props} />;
}
export function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      className={cn(
        "border-b border-border last:border-0 hover:bg-muted/35",
        className,
      )}
      {...props}
    />
  );
}
export function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      scope="col"
      className={cn("h-11 px-5 font-medium whitespace-nowrap", className)}
      {...props}
    />
  );
}
export function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return <td className={cn("px-5 py-4 align-middle", className)} {...props} />;
}
