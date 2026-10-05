import { Suspense } from "react";
import { VerifyEmailPage } from "@/components/auth/verify-email-page";

export const metadata = { title: "Verify email" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailPage />
    </Suspense>
  );
}
