"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRightIcon,
  EyeOpenIcon,
  EyeClosedIcon,
} from "@radix-ui/react-icons";
import {
  authenticate,
  completeTwoFactorLogin,
  resendOtpAction,
  verifyEmailAction,
} from "@/lib/actions";
import { signupSchema, loginSchema, type FormState } from "@/validations";
import { z } from "zod";
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
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifyPending, startVerify] = useTransition();
  const [resendPending, startResend] = useTransition();

  const [state, action, pending] = useActionState(
    authenticate.bind(null, mode),
    {} as FormState,
  );
  const [tfState, tfAction, tfPending] = useActionState(
    completeTwoFactorLogin,
    {} as FormState,
  );

  useEffect(() => {
    if (state.needsVerification && state.email) {
      setEmail(state.email);
      setTestOtp(state.testOtp ?? "");
      setOtp("");
      setVerifyError(null);
      setStep("verify");
    }
    if (state.requires2FA && state.userId) {
      setTwoFactorUserId(state.userId);
      setTwoFactorCode("");
      setStep("twoFactor");
    }
  }, [state]);

  const errors = local.fields ?? state.fields;

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
              const form = new FormData();
              form.set("email", email);
              form.set("code", otp);
              const result = await verifyEmailAction({}, form);
              if (result.error) {
                setVerifyError(result.error);
                return;
              }
              router.push("/login");
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
              const result = await resendOtpAction(email);
              if (result.error) setVerifyError(result.error);
              else {
                setVerifyError(null);
                if (result.testOtp) setTestOtp(result.testOtp);
                setOtp("");
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
      <form action={tfAction} className="space-y-5">
        <input type="hidden" name="userId" value={twoFactorUserId} />
        <input type="hidden" name="backup" value={useBackup ? "true" : "false"} />
        <input type="hidden" name="code" value={twoFactorCode} />
        <p className="text-sm text-muted-foreground">
          Two-factor authentication is enabled. Enter your{" "}
          {useBackup ? "backup code" : "authenticator code"} to continue.
        </p>
        {tfState.error ? (
          <p
            role="alert"
            className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
          >
            {tfState.error}
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
      </form>
    );
  }

  return (
    <form
      action={action}
      className="space-y-5"
      onSubmit={(e) => {
        const parsed = (signup ? signupSchema : loginSchema).safeParse({
          name: signup ? name : undefined,
          email,
          password,
        });
        if (!parsed.success) {
          e.preventDefault();
          setLocal({ fields: z.flattenError(parsed.error).fieldErrors });
        } else setLocal({});
      }}
    >
      {state.error ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {state.error}
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
