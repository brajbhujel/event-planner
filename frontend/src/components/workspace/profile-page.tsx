"use client";

import { useState, useTransition } from "react";
import { toast } from "@/hooks/use-toast";
import { profileSchema } from "@/validations";
import { ApiError } from "@/config/api";
import { authService } from "@/services/auth.service";
import { useWorkspaceUser } from "./user-context";
import { PageHeading } from "@/components/page-heading";
import { Field } from "@/components/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TwoFactorSettings } from "./two-factor-settings";

export function ProfilePage() {
  const user = useWorkspaceUser();
  const [name, setName] = useState(user.name);
  const [fieldError, setFieldError] = useState<string[] | undefined>();
  const [pending, startTransition] = useTransition();
  const dirty = name.trim() !== user.name;

  return (
    <>
      <PageHeading
        title="Profile"
        description="Update how your name appears on events."
      />
      <Card className="max-w-xl">
        <CardHeader>
          <h2 className="text-sm font-semibold">Account</h2>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              const parsed = profileSchema.safeParse({ name });
              if (!parsed.success) {
                setFieldError(
                  parsed.error.flatten().fieldErrors.name,
                );
                return;
              }
              setFieldError(undefined);
              startTransition(async () => {
                try {
                  await authService.updateProfile(parsed.data);
                  toast.success("Profile updated.");
                  window.location.reload();
                } catch (error) {
                  toast.error(
                    error instanceof ApiError
                      ? error.message
                      : "Could not update profile.",
                  );
                }
              });
            }}
          >
            <Field id="name" label="Full name" error={fieldError}>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                minLength={2}
                maxLength={80}
                required
              />
            </Field>
            <Field id="email" label="Email">
              <Input id="email" value={user.email} disabled readOnly />
            </Field>
            <Button disabled={pending || !dirty}>
              {pending ? "Saving…" : "Save profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className="mt-6">
        <TwoFactorSettings initiallyEnabled={user.twoFactorEnabled} />
      </div>
    </>
  );
}
