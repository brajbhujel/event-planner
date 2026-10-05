"use client";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { FormState, User } from "@/validations";
import { updateProfile } from "@/lib/actions";
import { PageHeading } from "@/components/page-heading";
import { Field } from "@/components/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function ProfilePage({ user }: { user: User }) {
  const router = useRouter();
  const [state, dispatch, pending] = useActionState(
    async (_prev: FormState, form: FormData) => {
      const next = await updateProfile(_prev, form);
      if (next.success) {
        toast.success(next.success);
        router.refresh();
      }
      if (next.error) toast.error(next.error);
      return next;
    },
    {} as FormState,
  );

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
          <form action={dispatch} className="space-y-5">
            <Field id="name" label="Full name" error={state.fields?.name}>
              <Input
                id="name"
                name="name"
                defaultValue={user.name}
                minLength={2}
                maxLength={80}
                required
              />
            </Field>
            <Field id="email" label="Email">
              <Input id="email" value={user.email} disabled readOnly />
            </Field>
            <Button disabled={pending}>
              {pending ? "Saving…" : "Save profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
