"use client";

import Link from "next/link";

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
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-(--border) bg-(--bg-overlay) hover:opacity-90 transition-opacity"
          >
            ← Back to Work
          </Link>
          {tags.length ? (
            <span className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-full border border-(--border) text-xs font-semibold text-(--muted)"
                >
                  {tag}
                </span>
              ))}
            </span>
          ) : null}
        </div>
        <h1 className="text-4xl md:text-6xl font-semibold">{title}</h1>
        {summary ? (
          <p className="text-lg md:text-xl text-(--muted) max-w-3xl">{summary}</p>
        ) : null}
      </header>

      <article className="space-y-10 leading-relaxed text-lg md:text-xl">
        {children}
      </article>
    </div>
  );
}
