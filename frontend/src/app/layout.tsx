import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import React from "react";

export const metadata: Metadata = {
  title: "MalangCode AI – Engineering Manager",
  description: "AI-powered Project and Engineering Manager for modern developer teams",
};

import { GeminiLiveProvider } from "@/context/GeminiLiveContext";
import { ThemeProvider } from "@/context/ThemeContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="h-full bg-[var(--background)] text-[var(--foreground)] flex overflow-hidden transition-colors duration-300">
        <ThemeProvider>
          <GeminiLiveProvider>
            {children}
          </GeminiLiveProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

