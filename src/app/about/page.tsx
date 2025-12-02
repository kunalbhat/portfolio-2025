"use client";

import AnimatedHeadline from "@/components/animated-headline";
import ExperienceCard from "@/components/experience-card";
import SiteHeader from "@/components/site-header";
import Image from "next/image";

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
      tags: ["Defi", "Web3"],
    },
    {
      date: "2015 — 2021",
      company: "PayPal / Braintree",
      title: [
        "Senior Technical Product Manager (L25)",
        "Product Manager (L24)",
        "Product Design Engineer (L24)",
      ],
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
      date: "2009 — 2012",
      company: "gravitytank",
      title: "Design Lead",
      sector: "Innovation",
      tags: ["Consulting", "Consumer electronics"],
    },
    {
      date: "2007 — 2009",
      company: "VSA Partners",
      title: "Designer",
      sector: "Agency",
      tags: ["B2B", "Mobile"],
    },
  ];

  return (
    <div className="page-container">
      <SiteHeader />

      <main className="py-10">
        <header className="mt-6 md:mt-12 mb-16 md:mb-32">
          <AnimatedHeadline
            className="font-semibold"
            text="Solving complex problems through research, design, and technical depth."
          />
        </header>
        <section className="max-w-4xl mx-auto flex flex-col space-y-28">
          <article>
            <h2>
              First and foremost a designer, I&apos;m a technically inclined
              builder who thrives in every stage of the product process &ndash;
              from early insights to delivery. With nearly two decades of
              experience across design, product management, and engineering,
              I&apos;m an end-to-end contributor who leads through
              collaboration.
              <br />
              <br />
              My favorite activities include 0-1 product definition,
              prototyping, research design &amp; analysis, and multi-variant
              experimentation.
            </h2>
          </article>
          <article className="space-y-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-12">
              <div className="relative w-56 md:w-64 aspect-4/5 rounded-2xl border border-(--border) overflow-hidden bg-(--bg) -rotate-2 hover:-rotate-1 transition-transform duration-300 md:-ml-10 drop-shadow-2xl">
                <Image
                  src="/images/kunal-aura.jpg"
                  alt="Kunal at Aura"
                  fill
                  sizes="(min-width: 768px) 16rem, 100vw"
                  className="object-cover"
                />
              </div>
              <p className="md:flex-1">
                Currently, at{" "}
                <a
                  href="https://www.auraframes.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  Aura
                </a>
                , I
                design for growth experimentation and lead product research to
                uncover our next big strategic opportunities.
              </p>
            </div>
            <div className="flex flex-col-reverse gap-6 md:flex-row md:items-center md:gap-12">
              <p className="md:flex-1">
                Before that, through{" "}
                <a
                  href="https://www.magicandmight.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  Magic+Might
                </a>
                , I dove deep into the autonomous ride-hail space working with{" "}
                <a
                  href="https://www.waymo.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  Waymo
                </a>{" "}
                to understand rider sentiment and design future experiences.
              </p>
              <div className="relative w-56 md:w-64 aspect-4/5 rounded-2xl border border-(--border) overflow-hidden bg-(--bg) rotate-2 hover:rotate-3 transition-transform duration-300 md:-mr-10 drop-shadow-2xl">
                <video
                  src="/videos/kunal-waymo.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-12">
              <div className="relative w-56 md:w-64 aspect-4/5 rounded-2xl border border-(--border) overflow-hidden bg-(--bg) -rotate-2 hover:-rotate-1 transition-transform duration-300 md:-ml-10 drop-shadow-2xl">
                <video
                  src="/videos/kunal-galactic.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="md:flex-1">
                At{" "}
                <a
                  href="https://thedefiant.io/education/infrastructure/off-ramp-crypto-in-one-click-with-skyteller"
                  target="_blank"
                  rel="noreferrer"
                >
                  Galactic
                </a>
                , a seed-staged startup (backed by Redpoint, Bloomberg Beta and
                Betaworks, among others) I took on an engineering role and
                explored crypto by building products that bridged the
                traditional finance world with web3.
              </p>
            </div>
            <div className="flex flex-col-reverse gap-6 md:flex-row md:items-center md:gap-12">
              <p className="md:flex-1">
                Prior to that, I spent 6 years at{" "}
                <a
                  href="https://www.paypal.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  PayPal
                </a>{" "}
                as a PM, building merchant experiences spanning from
                rearchitecting{" "}
                <a
                  href="https://wwww.braintreepayments.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  Braintree
                </a>
                &apos;s merchant dashboard to going deep into the Identity
                domain. I launched Braintree&apos;s Enterprise SSO offering,
                broke ground on a merchant data platform, and led the Identity
                component of PayPal&apos;s cross-organizational platform
                unification efforts.
              </p>
              <div className="relative w-56 md:w-64 aspect-4/5 rounded-2xl border border-(--border) overflow-hidden bg-(--bg) rotate-2 hover:rotate-3 transition-transform duration-300 md:-mr-10 drop-shadow-2xl">
                <Image
                  src="/images/kunal-braintree.jpg"
                  alt="Kunal at Braintree"
                  fill
                  sizes="(min-width: 768px) 16rem, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-12">
              <div className="relative w-56 md:w-64 aspect-4/5 rounded-2xl border border-(--border) overflow-hidden bg-(--bg) -rotate-2 hover:-rotate-1 transition-transform duration-300 md:-ml-10 drop-shadow-2xl">
                <Image
                  src="/images/kunal-modest.jpg"
                  alt="Kunal at Modest"
                  fill
                  sizes="(min-width: 768px) 16rem, 100vw"
                  className="object-cover"
                />
              </div>
              <p className="md:flex-1">
                Prior to that, I led design at{" "}
                <a
                  href="https://fortune.com/2015/08/19/paypal-acquisition-ebay-modest/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Modest
                </a>{" "}
                (acquired by PayPal) where we built a contextual commerce
                platform to help small and medium businesses launch quickly on
                native iOS and Android apps.
              </p>
            </div>
            <div className="flex flex-col-reverse gap-6 md:flex-row md:items-center md:gap-12">
              <p className="md:flex-1">
                Prior to that while at{" "}
                <a
                  href="https://www.businessinsider.com/salesforce-buys-gravitytank-2016-9"
                  target="_blank"
                  rel="noreferrer"
                >
                  gravitytank
                </a>{" "}
                I imagined future experiences for companies like Skype (I got to
                travel to Tokyo for research), Coinstar, and Samsung. I then
                moved on to design and help build the first major iterations of{" "}
                <a
                  href="https://www.dscout.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  Dscout
                </a>
                &apos;s mobile user research platform.
              </p>
              <div className="relative w-56 md:w-64 aspect-4/5 rounded-2xl border border-(--border) overflow-hidden bg-(--bg) rotate-2 hover:rotate-3 transition-transform duration-300 md:-mr-10 drop-shadow-2xl">
                <Image
                  src="/images/kunal-gravitytank.jpg"
                  alt="Kunal at gravitytank"
                  fill
                  sizes="(min-width: 768px) 16rem, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
            <p>
              Outside of work, I enjoy tennis,{" "}
              <a
                href="https://www.chess.com/member/kunal332"
                target="_blank"
                rel="noreferrer"
              >
                chess
              </a>
              , and doing my daily puzzles.
            </p>
          </article>
          <article id="experience">
            <header className="mb-8 md:mb-16">
              <h4>History</h4>
              <p>
                Throughout my career, I&apos;ve focused on new and emergent
                spaces, complexity, and scale.
              </p>
            </header>
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
