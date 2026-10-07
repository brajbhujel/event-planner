"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRightIcon,
  EyeOpenIcon,
  EyeClosedIcon,
} from "@radix-ui/react-icons";
import { signupSchema, loginSchema, type FormState } from "@/validations";
import { z } from "zod";
import { ApiError } from "@/config/api";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/field";
import { CodeInput } from "@/components/ui/code-input";

type Step = "credentials" | "verify" | "twoFactor";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const signup = mode === "signup";
  const [step, setStep] = useState<Step>("credentials");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [testOtp, setTestOtp] = useState("");
  const [twoFactorUserId, setTwoFactorUserId] = useState("");
  const [useBackup, setUseBackup] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [local, setLocal] = useState<FormState>({});
  const [error, setError] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [tfError, setTfError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [verifyPending, startVerify] = useTransition();
  const [resendPending, startResend] = useTransition();
  const [tfPending, startTf] = useTransition();

  const errors = local.fields;

  if (step === "verify") {
    return (
      <div className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code sent to{" "}
          <span className="font-medium text-foreground">{email}</span>. It expires
          in 10 minutes.
        </p>
        {testOtp ? (
          <p className="rounded-md border bg-muted/50 p-3 text-xs text-muted-foreground">
            Test OTP:{" "}
            <span className="font-mono font-medium text-foreground">{testOtp}</span>
          </p>
        ) : null}
        {verifyError ? (
          <p
            role="alert"
            className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
          >
            {verifyError}
          </p>
        ) : null}
        <CodeInput value={otp} onChange={setOtp} autoFocus />
        <Button
          className="w-full"
          disabled={verifyPending || otp.length !== 6}
          onClick={() =>
            startVerify(async () => {
              try {
                await authService.verifyEmail({ email, code: otp });
                router.push("/login");
              } catch (err) {
                setVerifyError(
                  err instanceof ApiError
                    ? err.message
                    : "Could not verify email.",
                );
              }
            })
          }
        >
          {verifyPending ? "Verifying…" : "Verify email"}
          <ArrowRightIcon />
        </Button>
        <button
          type="button"
          className="w-full text-center text-sm font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
          disabled={resendPending}
          onClick={() =>
            startResend(async () => {
              try {
                const result = await authService.resendOtp(email);
                setVerifyError(null);
                if (result.testOtp) setTestOtp(result.testOtp);
                setOtp("");
              } catch (err) {
                setVerifyError(
                  err instanceof ApiError
                    ? err.message
                    : "Could not resend code.",
                );
              }
            })
          }
        >
          {resendPending ? "Sending…" : "Resend code"}
        </button>
        <button
          type="button"
          className="w-full text-center text-sm text-muted-foreground"
          onClick={() => setStep("credentials")}
        >
          Back
        </button>
      </div>
    );
  }

  if (step === "twoFactor") {
    return (
      <div className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Two-factor authentication is enabled. Enter your{" "}
          {useBackup ? "backup code" : "authenticator code"} to continue.
        </p>
        {tfError ? (
          <p
            role="alert"
            className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
          >
            {tfError}
          </p>
        ) : null}
        {useBackup ? (
          <Field id="backup-code" label="Backup code">
            <Input
              id="backup-code"
              value={twoFactorCode}
              onChange={(e) =>
                setTwoFactorCode(e.target.value.toUpperCase().slice(0, 8))
              }
              placeholder="A1B2C3D4"
              maxLength={8}
              autoFocus
            />
          </Field>
        ) : (
          <CodeInput
            value={twoFactorCode}
            onChange={setTwoFactorCode}
            autoFocus
          />
        )}
        <Button
          className="w-full"
          disabled={
            tfPending ||
            (useBackup ? twoFactorCode.length < 8 : twoFactorCode.length !== 6)
          }
          onClick={() =>
            startTf(async () => {
              try {
                await authService.completeTwoFactor({
                  userId: twoFactorUserId,
                  code: twoFactorCode,
                  backup: useBackup,
                });
                router.replace("/dashboard");
              } catch (err) {
                setTfError(
                  err instanceof ApiError
                    ? err.message
                    : "Could not complete 2FA.",
                );
              }
            })
          }
        >
          {tfPending ? "Verifying…" : "Verify and sign in"}
          <ArrowRightIcon />
        </Button>
        <button
          type="button"
          className="w-full text-center text-sm text-primary underline-offset-4 hover:underline"
          onClick={() => {
            setUseBackup((v) => !v);
            setTwoFactorCode("");
          }}
        >
          {useBackup
            ? "Use authenticator app instead"
            : "Use a backup code instead"}
        </button>
        <button
          type="button"
          className="w-full text-center text-sm text-muted-foreground"
          onClick={() => setStep("credentials")}
        >
          Back to password
        </button>
      </div>
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        setLocal({});
        setError(null);
        startTransition(async () => {
          try {
            if (signup) {
              const parsed = signupSchema.safeParse({ name, email, password });
              if (!parsed.success) {
                setLocal({ fields: z.flattenError(parsed.error).fieldErrors });
                return;
              }
              const data = await authService.signup(parsed.data);
              if (data.needsVerification && data.email) {
                setEmail(data.email);
                setTestOtp(data.testOtp ?? "");
                setOtp("");
                setVerifyError(null);
                setStep("verify");
                return;
              }
              setError("Unexpected signup response.");
              return;
            }
            const parsed = loginSchema.safeParse({ email, password });
            if (!parsed.success) {
              setLocal({ fields: z.flattenError(parsed.error).fieldErrors });
              return;
            }
            const result = await authService.login(parsed.data);
            if (result.kind === "needsVerification") {
              setEmail(result.email);
              setTestOtp(result.testOtp ?? "");
              setOtp("");
              setVerifyError(null);
              setStep("verify");
              return;
            }
            if (result.kind === "requires2FA") {
              setTwoFactorUserId(result.userId);
              setTwoFactorCode("");
              setTfError(null);
              setStep("twoFactor");
              return;
            }
            router.replace("/dashboard");
          } catch (err) {
            setError(
              err instanceof ApiError
                ? err.message
                : "Something went wrong. Please try again.",
            );
            if (err instanceof ApiError && err.fields) {
              setLocal({ fields: err.fields });
            }
          }
        });
      }}
    >
      {error ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}
      {signup ? (
        <Field id="name" label="Full name" error={errors?.name}>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            autoComplete="name"
            minLength={2}
            maxLength={80}
            required
          />
        </Field>
      ) : null}
      <Field id="email" label="Email address" error={errors?.email}>
        <Input
          id="email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
