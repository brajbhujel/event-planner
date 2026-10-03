import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "Gather · Event planner", template: "%s · Gather" },
  description: "A little less planning. A little more coming together.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
