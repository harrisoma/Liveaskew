/* eslint-disable react-refresh/only-export-components */
import type { Metadata } from "next";
import { Shell } from "@liveaskew/ui";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Hive — LiveAskew",
  description: "One community for motherhood, style, everyday life, and editorial.",
  icons: { icon: "/hive.png" },
};

const links = [
  { href: "/", label: "Rooms" },
  { href: "/messages", label: "Messages" },
  { href: "/challenges", label: "Challenges" },
  { href: "/signin", label: "Sign in" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Shell mark="/hive.png" title="The Hive" links={links}>
          {children}
        </Shell>
      </body>
    </html>
  );
}
