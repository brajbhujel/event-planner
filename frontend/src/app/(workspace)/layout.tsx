import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/workspace/app-shell";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return <AppShell user={user}>{children}</AppShell>;
}