import { AuthForm } from "./auth-form";

export function LoginPage() {
  return (
    <>
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        Welcome back
      </p>
      <h2 className="text-3xl font-semibold tracking-tight">Sign in</h2>
      <p className="mb-8 mt-3 text-sm leading-relaxed text-muted-foreground">
        Continue managing your events.
      </p>
      <AuthForm mode="login" />
    </>
  );
}
