import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-medium text-muted-foreground">
        404 · Not found
      </p>
      <h1 className="mt-3 text-2xl font-semibold">This page isn’t available</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        It may have been removed, or you may not have access.
      </p>
      <Button asChild className="mt-6">
        <Link href="/dashboard">Back to overview</Link>
      </Button>
    </div>
  );
}
