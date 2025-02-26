"use client";  // Ensure it's a client component

import "./globals.css"; 
import { Analytics } from "@vercel/analytics/next";
import SessionProvider from "./components/SessionProvider"; // Make sure this exists

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Froggy Folios Whitelist Checker</title>
        <meta name="description" content="Check your whitelist status" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <SessionProvider>
          {children}
          </SessionProvider>
          <Analytics />

      </body>
    </html>
  );
}
