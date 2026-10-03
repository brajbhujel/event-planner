import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/workspace/app-shell";
import { ProfilePage } from "@/components/workspace/profile-page";

export const metadata = { title: "Profile" };

export default async function Page() {
  const user = await requireUser();
  return (
    <AppShell user={user}>
      <ProfilePage user={user} />
    </AppShell>
  );
}
