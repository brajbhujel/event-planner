"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/validations";
import { authService, ApiError } from "@/services/auth.service";
import { AppShell } from "@/components/workspace/app-shell";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;
    authService
      .me()
      .then((next) => {
        if (!cancelled) setUser(next);
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 401) {
          router.replace("/login");
          return;
        }
        throw error;
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!user) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return <AppShell user={user}>{children}</AppShell>;
}
