"use client";
import { useEffect } from "react";
import { toast } from "sonner";

export function SavedToast({ saved }: { saved?: string }) {
  useEffect(() => {
    if (saved === "created") toast.success("Event created");
    if (saved === "updated") toast.success("Event updated");
  }, [saved]);
  return null;
}
