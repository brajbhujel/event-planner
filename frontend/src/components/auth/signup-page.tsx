import { AuthForm } from "./auth-form";

export function SignupPage() {
  return (
    <>
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        Get started
      </p>
      <h2 className="text-3xl font-semibold tracking-tight">Create account</h2>
      <p className="mb-8 mt-3 text-sm leading-relaxed text-muted-foreground">
        Sign up to create and manage events.
      </p>
      <AuthForm mode="signup" />
    </>
  );
}
