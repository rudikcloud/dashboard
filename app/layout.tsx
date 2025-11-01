import type { Metadata } from "next";
import { AppShell } from "../components/layout/app-shell";
import { ToastProvider } from "../components/ui/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "RudikCloud Dashboard",
  description: "Milestone 0 dashboard for RudikCloud",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
