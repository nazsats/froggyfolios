import type { Metadata } from "next";
import "./globals.css"; // ✅ Ensure global styles are here

export const metadata: Metadata = {
  title: "Froggy Folios Whitelist Checker",
  description: "Check your whitelist status",
  icons: {
    icon: "./logo.png", // ✅ Set the path to your new favicon
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
