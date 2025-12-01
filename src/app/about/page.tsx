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
            <h2>
              First and foremost a designer, I&apos;m a technically inclined
              builder who thrives in every stage of the product process &ndash;
              from early insights to delivery. With nearly two decades of
              experience across design, product management, and engineering,
              I&apos;m an end-to-end contributor who leads through
              collaboration.
            </h2>
          </article>
          <article className="space-y-6">
            <p>
              Currently, at <a href="#">Aura</a>, I design for growth
              experimentation and lead continuous research.
            </p>
            <p>
              Before that, through <a href="#">Magic+Might</a>, I dove deep into
              the autonomous ride-hail space working with <a href="#">Waymo</a>{" "}
              to understand rider sentiment and design future experiences.
            </p>
            <p>
              At <a href="#">Galactic</a>, a seed-staged startup (backed by
              Redpoint, Bloomberg Beta and Betaworks, among others) I explored
              crypto and building products that bridged the traditional finance
              world with web3.
            </p>
            <p>
              Prior to that, I spent 6 years at <a href="#">PayPal</a> building
              merchant experiences spanning from redefining the UX of{" "}
              <a href="#">Braintree</a>&apos;s merchant dashboard to going deep
              into the Identity domain. I launched Braintree&apos;s Enterprise
              SSO offering, broke ground on a merchant data platform, and led
              the Identity component of PayPal&apos;s cross-organizational
              platform unification efforts.
            </p>
            <p>
              Prior to that, I led design at <a href="#">Modest</a> (acquired by
              PayPal) where we built a contextual commerce platform to help
              small and medium businesses launch quickly on native iOS and
              Android apps.
            </p>
            <p>
              Prior to that, I designed and built the first iterations of
              <a href="#">dscout</a>&apos;s mobile research platform.
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
