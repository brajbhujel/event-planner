import { CalendarIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Brand({
  light = false,
  className,
}: {
  light?: boolean;
  className?: string;
}) {
  return (
    <Link
      href="/dashboard"
      className={cn("inline-flex items-center gap-2.5", className)}
      aria-label="Gather home"
    >
      <span
        className={`flex size-9 items-center justify-center rounded-lg ${light ? "bg-white/15 text-white" : "bg-primary text-white"}`}
      >
        <CalendarIcon className="size-5" />
      </span>
      <span className="text-[23px] font-semibold tracking-[-0.06em]">
        gather
        <span className={light ? "text-white/50" : "text-primary/40"}>.</span>
      </span>
    </Link>
  );
}
