/* eslint-disable react-refresh/only-export-components */
import type { Metadata } from "next";
import { Shell } from "@liveaskew/ui";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Buzz — LiveAskew",
  description: "Schedule the look Bee made. Instagram, TikTok, Pinterest, Facebook, LinkedIn.",
  icons: { icon: "/buzz.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Shell mark="/buzz.png" title="The Buzz" links={[{ href: "/", label: "Schedule" }]}>
          {children}
        </Shell>
      </body>
    </html>
  );
}
