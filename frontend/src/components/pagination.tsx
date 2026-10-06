import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";

type PaginationProps = {
  page: number;
  totalPages: number;
  previousHref?: string;
  nextHref?: string;
};

export function Pagination({
  page,
  totalPages,
  previousHref,
  nextHref,
}: PaginationProps) {
  return (
    <nav aria-label="Pagination" className="flex items-center gap-2">
      {previousHref ? (
        <Button asChild size="sm" variant="outline">
          <Link href={previousHref}>
            <ChevronLeftIcon />
            Previous
          </Link>
        </Button>
      ) : (
        <Button size="sm" variant="outline" disabled>
          <ChevronLeftIcon />
          Previous
        </Button>
      )}
      <span className="px-2 text-xs tabular-nums text-muted-foreground">
        {page} / {totalPages}
      </span>
      {nextHref ? (
        <Button asChild size="sm" variant="outline">
          <Link href={nextHref}>
            Next
            <ChevronRightIcon />
          </Link>
        </Button>
      ) : (
        <Button size="sm" variant="outline" disabled>
          Next
          <ChevronRightIcon />
        </Button>
      )}
    </nav>
  );
}
