"use client";
import { useEffect } from "react";
import { toast } from "sonner";

export function DeletedToast({
  notice,
}: {
  notice?: string | string[];
}) {
  useEffect(() => {
    if (notice === "deleted") toast.success("Event deleted");
  }, [notice]);
  return null;
}
