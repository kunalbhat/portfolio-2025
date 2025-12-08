import type { Metadata } from "next";
import { Albert_Sans } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Image from "next/image";

/* Load Google Sans Flex from Google Fonts via <link> */
export const metadata: Metadata = {
  title: "Kunal Bhat — Product Designer",
  description:
    "Multidisciplinary product designer with experience in design, product management, and engineering.",
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
        <footer className="site-footer flex flex-wrap items-center justify-center gap-2 px-4 md:px-8 text-base text-center">
          <span>&copy; 2025 Kunal Bhat — Chicago</span>
          <span className="hidden sm:inline text-(--muted)">•</span>
          <span className="flex items-center gap-1">
            Built with ❤️ Next.js +
            <Image
              src="/images/logo-open-ai.svg"
              alt="OpenAI"
              width={18}
              height={18}
              className="inline-block h-4 w-4 align-middle"
            />
            <span className="hidden sm:inline text-(--muted)">•</span> Deployed
            to Vercel.
          </span>
        </footer>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
