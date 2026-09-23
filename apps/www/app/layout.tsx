/* eslint-disable react-refresh/only-export-components */
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LiveAskew",
  description: "Bee, The Hive, and The Buzz. Three products. One house.",
  icons: { icon: "/liveaskew-signature.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
