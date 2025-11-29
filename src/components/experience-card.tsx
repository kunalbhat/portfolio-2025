"use client";

type ExperienceCardProps = {
  date: string;
  company: string;
  title: string;
  sector: string;
};

export default function ExperienceCard({
  date,
  company,
  title,
  sector,
}: ExperienceCardProps) {
  return (
    <li className="grid grid-flow-row md:grid-flow-col grid-cols-3 text-xl md:text-2xl font-medium gap-x-4">
      <span>{date}</span>
      <span>
        {company}
        <br />
        {title}
      </span>
      <span className="text-right">{sector}</span>
    </li>
  );
}
