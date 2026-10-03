import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/workspace/app-shell";
import { DashboardPage } from "@/components/workspace/dashboard-page";

export const metadata = { title: "Overview" };

export default async function Page() {
  const user = await requireUser();
  return (
    <AppShell user={user}>
      <DashboardPage />
    </AppShell>
  );
}
