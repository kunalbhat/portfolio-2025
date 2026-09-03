import type { Metadata } from "next";
import { Jost } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "Kunal Bhat — Product Designer",
  description:
    "Multidisciplinary product designer with experience in design, product management, and engineering.",
};

const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={jost.variable} suppressHydrationWarning>
      <body>
        {children}
        <footer className="site-footer">
          <span>&copy; 2025 Kunal Bhat — Chicago</span>
        </footer>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
