import type { Metadata } from "next";
import { Albert_Sans } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Image from "next/image";

/* Load Google Sans Flex from Google Fonts via <link> */
export const metadata: Metadata = {
  title: "kunal@localhost",
  description: "A terminal.",
};

const albert = Albert_Sans({
  subsets: ["latin"],
  variable: "--font-albert",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="light"
      className={albert.variable}
      suppressHydrationWarning
    >
      <body>
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
