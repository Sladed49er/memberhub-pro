// ============================================
// FILE: app/layout.tsx
// PURPOSE: Root layout for the application
// FIX: Removed Header from here - it's added per-page instead
// LAST MODIFIED: December 19, 2024
// ============================================

import { type Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import "./globals.css";
// Removed Header import - pages handle their own headers

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MemberHub Pro",
  description: "Next-Generation Membership Management Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          {/* Removed Header from here - each page adds its own */}
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
