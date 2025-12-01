"use client";

import Link from "next/link";
import Image from "next/image";

type WorkDetailLayoutProps = {
  title: string;
  summary?: string;
  tags?: string[];
  children: React.ReactNode;
};

export default function WorkDetailLayout({
  title,
  summary,
  tags = [],
  children,
}: WorkDetailLayoutProps) {
  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-10 md:mb-14 space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-(--muted)">
          <Link
            href="/work"
            className="h-12 w-12 rounded-full grid place-items-center border border-(--border) bg-[color-mix(in_srgb,var(--bg)70%,transparent)] backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.14)] hover:opacity-90 transition-all"
            aria-label="Back to Work"
          >
            <Image
              src="/images/icon-arrow-back.svg"
              alt="Back"
              width={28}
              height={28}
              className="h-7 w-7"
              priority
            />
          </Link>
        </div>
        <h1 className="text-3xl md:text-6xl font-semibold mt-4 md:mt-6">
          {title}
        </h1>
        {summary ? (
          <p className="text-lg md:text-xl text-(--muted) max-w-3xl">
            {summary}
          </p>
        ) : null}
      </header>

      <article className="space-y-10 leading-relaxed text-lg md:text-xl">
        {children}
      </article>
    </div>
  );
}
