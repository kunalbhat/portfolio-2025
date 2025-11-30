"use client";

import AnimatedHeadline from "@/components/animated-headline";
import ExperienceCard from "@/components/experience-card";
import SiteHeader from "@/components/site-header";

export default function AboutPage() {
  const experience = [
    {
      date: "2024 — present",
      company: "Aura Home",
      title: "Staff Product Designer",
      sector: "Photos",
      tags: ["Consumer", "Growth"],
    },
    {
      date: "2023 — 2024",
      company: "Magic+Might",
      title: "Design Director",
      sector: "Autonomous ride-hail",
      tags: ["Startup", "Mobility"],
    },
    {
      date: "2021 — 2023",
      company: "Galactic",
      title: "Senior Design Engineer",
      sector: "Crypto",
      tags: ["Enterprise", "Infrastructure"],
    },
    {
      date: "2015 — 2021",
      company: "PayPal / Braintree",
      title: "Senior Technical Product Manager (L27)",
      sector: "Merchant Experience",
      tags: ["Enterprise", "Payments"],
    },
    {
      date: "2014 — 2015",
      company: "Modest (acquired by PayPal)",
      title: "Design Lead",
      sector: "Contextual Commerce",
      tags: ["Consumer", "Mobile"],
    },
    {
      date: "2012 — 2014",
      company: "dscout",
      title: "Design Lead",
      sector: "User Research",
      tags: ["B2B", "Mobile"],
    },
    {
      date: "2010 — 2012",
      company: "gravitytank",
      title: "Design Lead",
      sector: "Innovation",
      tags: ["B2B", "Mobile"],
    },
  ];

  return (
    <div className="max-w-8xl px-6 md:px-16 pt-20 md:pt-28 mx-auto transition-colors duration-650 ease-[cubic-bezier(0.25,0.8,0.35,1)]">
      <SiteHeader />

      <main className="py-10 md:py-14 min-h-screen">
        <header className="mt-6 md:mt-12 mb-16 md:mb-32">
          <AnimatedHeadline
            className="mb-3 md:text-7xl lg:text-8xl font-semibold"
            text="Solving complex problems through research, design, and technical depth."
          />
        </header>
        <section className="max-w-4xl mx-auto flex flex-col space-y-24">
          <article>
            <p className="md:text-4xl leading-normal">
              First and foremost a designer, I&apos;m a technically inclined
              builder who thrives in every stage of the product process &ndash;
              from early insights to delivery. With nearly two decades of
              experience across design, product management, and engineering,
              I&apos;m an end-to-end contributor who leads through
              collaboration.
            </p>
          </article>
          <article id="experience">
            <h4 className="mb-10 md:mb-20 font-semibold">Experience</h4>
            <ul className="flex flex-col gap-12">
              {experience.map((role) => (
                <ExperienceCard
                  key={`${role.company}-${role.date}`}
                  {...role}
                />
              ))}
            </ul>
          </article>
        </section>
      </main>
    </div>
  );
}
