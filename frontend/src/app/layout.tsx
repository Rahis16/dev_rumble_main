import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import React from "react";

export const metadata: Metadata = {
  title: "MalangCode AI – Engineering Manager",
  description: "AI-powered Project and Engineering Manager for modern developer teams",
};

import { GeminiLiveProvider } from "@/context/GeminiLiveContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-[#090d16] text-[#f8fafc] flex overflow-hidden">
        <GeminiLiveProvider>
          {children}
        </GeminiLiveProvider>
      </body>
    </html>
  );
}
