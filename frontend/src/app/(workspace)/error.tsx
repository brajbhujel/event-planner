"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="rounded-lg border bg-white px-6 py-16 text-center">
      <h1 className="text-xl font-semibold">We couldn’t load this page</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The server may be temporarily unavailable. Please try again.
      </p>
      <Button onClick={reset} className="mt-6">
        Try again
      </Button>
    </div>
  );
}
