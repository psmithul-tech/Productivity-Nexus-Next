import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Restia — AI Chief of Staff",
  description: "Your intelligent executive assistant for tasks, calendar, reminders, and more.",
  verification: {
    google: "DbJl-1AhgerkXOlX68G_owhxOqoncgwBwa0fChNA-ik",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-background text-foreground antialiased`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
