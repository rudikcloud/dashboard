import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}
