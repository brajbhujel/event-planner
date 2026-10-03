import { requireUser } from "@/lib/auth";
import { ProfilePage } from "@/components/workspace/profile-page";

export const metadata = { title: "Profile" };

export default async function Page() {
  const user = await requireUser();
  return <ProfilePage user={user} />;
}
