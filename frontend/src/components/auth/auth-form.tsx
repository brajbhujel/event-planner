"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  EyeOpenIcon,
  EyeClosedIcon,
} from "@radix-ui/react-icons";
import { authenticate } from "@/lib/actions";
import { signupSchema, loginSchema, type FormState } from "@/validations";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/field";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [state, action, pending] = useActionState(
    authenticate.bind(null, mode),
    {} as FormState,
  );
  const [local, setLocal] = useState<FormState>({});
  const [showPassword, setShowPassword] = useState(false);
  const errors = local.fields ?? state.fields;
  const signup = mode === "signup";

  return (
    <form
      action={action}
      className="space-y-5"
      onSubmit={(e) => {
        const parsed = (signup ? signupSchema : loginSchema).safeParse(
          Object.fromEntries(new FormData(e.currentTarget)),
        );
        if (!parsed.success) {
          e.preventDefault();
          setLocal({ fields: z.flattenError(parsed.error).fieldErrors });
        } else setLocal({});
      }}
    >
      {state.error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}
      {signup && (
        <Field id="name" label="Full name" error={errors?.name}>
          <Input
            id="name"
            name="name"
            placeholder="Your full name"
            autoComplete="name"
            minLength={2}
            maxLength={80}
            required
          />
        </Field>
      )}
      <Field id="email" label="Email address" error={errors?.email}>
        <Input
          id="email"
          type="email"
          name="email"
          placeholder="you@example.com"
          autoComplete="email"
          maxLength={254}
          required
        />
      </Field>
      <Field
        id="password"
        label="Password"
        hint={signup ? "Use at least 8 characters." : undefined}
        error={errors?.password}
      >
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            className="pr-11"
            placeholder={signup ? "Create a password" : "Enter your password"}
            minLength={signup ? 8 : 1}
            maxLength={128}
            autoComplete={signup ? "new-password" : "current-password"}
            required
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 px-3 text-muted-foreground"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
          </button>
        </div>
      </Field>
      <Button className="w-full" disabled={pending}>
        {pending
          ? signup
            ? "Creating account…"
            : "Signing in…"
          : signup
            ? "Create account"
            : "Sign in"}
        <ArrowRightIcon />
      </Button>
      <p className="pt-2 text-center text-sm text-muted-foreground">
        {signup ? "Already have an account?" : "New here?"}{" "}
        <Link
          className="font-medium text-primary underline-offset-4 hover:underline"
          href={signup ? "/login" : "/signup"}
        >
          {signup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
