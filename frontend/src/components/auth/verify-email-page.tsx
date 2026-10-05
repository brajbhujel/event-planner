"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { resendOtpAction, verifyEmailAction } from "@/lib/actions";
import type { FormState } from "@/validations";
import { Button } from "@/components/ui/button";
import { CodeInput } from "@/components/ui/code-input";

export function VerifyEmailPage() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const [otp, setOtp] = useState("");
  const [testOtp, setTestOtp] = useState(params.get("testOtp") ?? "");
  const [state, action, pending] = useActionState(
    verifyEmailAction,
    {} as FormState,
  );
  const [resendPending, startResend] = useTransition();
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!state.success) return;
    const t = setTimeout(() => router.push("/login"), 1200);
    return () => clearTimeout(t);
  }, [state.success, router]);

  if (!email) {
    return (
      <>
        <h2 className="text-3xl font-semibold tracking-tight">Verify email</h2>
        <p className="mb-8 mt-3 text-sm text-muted-foreground">
          Missing email. Start from{" "}
          <Link
            href="/signup"
            className="text-primary underline-offset-4 hover:underline"
          >
            sign up
          </Link>
          .
        </p>
      </>
    );
  }

  return (
    <>
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        Almost there
      </p>
      <h2 className="text-3xl font-semibold tracking-tight">Verify your email</h2>
      <p className="mb-8 mt-3 text-sm leading-relaxed text-muted-foreground">
        Enter the 6-digit code sent to{" "}
        <span className="font-medium text-foreground">{email}</span>. It expires in
        10 minutes.
      </p>

      {testOtp ? (
        <p className="mb-4 rounded-md border bg-muted/50 p-3 text-xs text-muted-foreground">
          Test OTP:{" "}
          <span className="font-mono font-medium text-foreground">{testOtp}</span>
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
          {state.success} Redirecting to sign in…
        </p>
      ) : (
        <form action={action} className="space-y-5">
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="code" value={otp} />
          {state.error ? (
            <p
              role="alert"
              className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
            >
              {state.error}
            </p>
          ) : null}
          <CodeInput value={otp} onChange={setOtp} autoFocus />
          <Button className="w-full" disabled={pending || otp.length !== 6}>
            {pending ? "Verifying…" : "Verify email"}
            <ArrowRightIcon />
          </Button>
        </form>
      )}

      <div className="mt-6 space-y-2 text-center text-sm text-muted-foreground">
        {resendMsg ? <p className="text-primary">{resendMsg}</p> : null}
        <button
          type="button"
          className="font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
          disabled={resendPending || Boolean(state.success)}
          onClick={() =>
            startResend(async () => {
              const result = await resendOtpAction(email);
              if (result.error) setResendMsg(result.error);
              else {
                setResendMsg(result.success ?? "Code sent.");
                if (result.testOtp) setTestOtp(result.testOtp);
                setOtp("");
              }
            })
          }
        >
          {resendPending ? "Sending…" : "Resend code"}
        </button>
        <p>
          <Link href="/login" className="underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </>
  );
}
