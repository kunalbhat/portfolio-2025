"use client";

type ExperienceCardProps = {
  date: string;
  company: string;
  title: string;
  sector: string;
  tags?: string[];
};

export default function ExperienceCard({
  date,
  company,
  title,
  sector,
  tags = [],
}: ExperienceCardProps) {
  return (
    <li className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 items-start text-xl md:text-2xl font-medium">
      <span className="text-left">{date}</span>
      <span className="text-left">
        {company}
        <br />
        {title}
      </span>
      <div className="col-span-2 md:col-span-1 flex flex-col items-start md:items-end gap-2 text-left md:text-right">
        <div className="leading-tight">{sector}</div>
        {tags.length ? (
          <span className="flex flex-wrap gap-2 text-sm font-semibold text-(--muted) justify-start md:justify-end">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2.5 py-1 rounded-full border border-(--border) bg-(--bg-overlay)"
              >
                {tag}
              </span>
            ))}
          </span>
        ) : null}
      </div>
    </li>
  );
}
