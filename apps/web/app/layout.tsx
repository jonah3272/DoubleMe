import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal Project OS",
  description: "Think, plan, and execute across multiple long-running projects.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={GeistSans.className}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
