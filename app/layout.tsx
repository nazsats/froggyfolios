import type { Metadata } from "next";
import "./globals.css"; // ✅ Ensure global styles are here
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: "Froggy Folios Whitelist Checker",
  description: "Check your whitelist status",
  icons: {
    icon: "./favicon.ico", // ✅ Set the path to your new favicon
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
          <Analytics />
      </body>
       
    </html>
  );
}
