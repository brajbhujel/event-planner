import { AuthGuard } from "@/components/workspace/authGuard";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
