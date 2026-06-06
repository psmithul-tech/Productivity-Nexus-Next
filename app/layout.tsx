import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";


import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Restia — Your Personal AI Operating System",
  description: "Restia is a modular AI operating system for your life. Launch Chief of Staff, your AI productivity agent, and unlock more modules soon.",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  verification: {
    google: "DbJl-1AhgerkXOlX68G_owhxOqoncgwBwa0fChNA-ik",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600;700&family=Nunito+Sans:wght@400;700&display=swap" rel="stylesheet"/>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      </head>
      <body className="bg-background text-on-surface antialiased transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
