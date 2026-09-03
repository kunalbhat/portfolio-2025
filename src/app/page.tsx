"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useRef, useState } from "react";

type Project = {
  title: string;
  year: string;
  bg: string;
  video?: string;
};

const PROJECTS: Project[] = [
  {
    title: "Aura Captions",
    year: "'24",
    bg: "bg-[#F6F2EE]",
    video: "/videos/aura-captions.mp4",
  },
];

const HEADLINE = "Greetings — I'm Kunal, a Chicago-based visual designer and curious builder.";
const HEADLINE_WORDS = HEADLINE.trim().split(/\s+/);

export default function HomePage() {
  const [isVisible, setIsVisible] = useState(true);
  const [hasScrolled, setHasScrolled] = useState(false);
  const { scrollY } = useScroll();
  const lastScroll = useRef(0);
  const lastHidePosition = useRef(0);
  const [enterFrom, setEnterFrom] = useState(0);

  useMotionValueEvent(scrollY, "change", (value) => {
    const current = value ?? 0;
    setHasScrolled(current > 12);
    const delta = current - lastScroll.current;

    // Always show near the top
    if (current < 20) {
      setIsVisible(true);
      lastHidePosition.current = current;
      lastScroll.current = current;
      return;
    }

    // If scrolling further down while hidden, update the hide anchor
    if (!isVisible && delta > 0) {
      lastHidePosition.current = current;
    }

    // Hide when scrolling down
    if (delta > 0 && isVisible) {
      setEnterFrom(0);
      setIsVisible(false);
      lastHidePosition.current = current;
    }

    // Reveal after 120px of upward travel from the last hide point
    if (delta < 0 && !isVisible) {
      const upDistance = lastHidePosition.current - current;
      if (upDistance >= 120) {
        setEnterFrom(50);
        setIsVisible(true);
      }
    }

    lastScroll.current = current;
  });

  return (
    <div className="page-container">
      <motion.header
        className="fixed inset-x-0 top-0 z-30 site-header"
        initial={{ opacity: 1, y: 0, pointerEvents: "auto" }}
        animate={
          isVisible
            ? {
                opacity: 1,
                y: 0,
                pointerEvents: "auto",
                transition: {
                  opacity: { duration: 0.35, ease: [0.25, 0.8, 0.35, 1] },
                  y: {
                    from: enterFrom,
                    duration: 0.55,
                    ease: [0.25, 0.8, 0.35, 1],
                  },
                },
              }
            : {
                opacity: 0,
                y: -12,
                pointerEvents: "none",
                transition: { duration: 0.3, ease: [0.25, 0.8, 0.35, 1] },
              }
        }
      >
        <div className="max-w-8xl mx-auto px-3 md:px-8">
          <div className="flex items-center my-3 md:my-4">
            <Link
              href="/"
              className={`group flex items-center gap-4 rounded-full transform-gpu transition-all duration-400 ease-[cubic-bezier(0.25,0.8,0.35,1)] hover:opacity-90 ${
                hasScrolled
                  ? "pl-3 pr-5 py-2 border border-(--border) bg-[color-mix(in_srgb,var(--bg)70%,transparent)] backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.14)]"
                  : "border border-transparent bg-transparent shadow-none"
              }`}
            >
              <motion.div
                className="h-12 w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 rounded-full bg-(--accent) flex items-center justify-center shrink-0 overflow-hidden transition-transform duration-300 group-hover:scale-105"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{
                  scale: [0.7, 1.06, 0.98, 1],
                  opacity: [0, 1, 1, 1],
                }}
                transition={{
                  duration: 0.9,
                  times: [0, 0.5, 0.82, 1],
                  ease: [0.26, 0.86, 0.44, 1],
                  delay: 0.05,
                }}
              >
                <Image
                  src="/images/site-icon.svg"
                  alt="Site icon"
                  width={40}
                  height={40}
                  className="h-11 w-11 md:h-12 md:w-12 lg:h-14 lg:w-14 object-contain"
                  priority
                />
              </motion.div>

              <span className="font-normal text-3xl md:text-4xl lg:text-5xl text-(--fg) bg-transparent">
                Kunal Bhat
              </span>
            </Link>
          </div>
        </div>
      </motion.header>

      <main className="pb-24">
        <header className="max-w-3xl mt-4 md:mt-8 mb-8 md:mb-12">
          <h1 className="font-normal text-3xl md:text-4xl lg:text-5xl leading-tight md:leading-tight">
            {HEADLINE_WORDS.map((word, index) => (
              <span key={`${word}-${index}`} className="inline-block">
                {word}
                {index < HEADLINE_WORDS.length - 1 ? " " : ""}
              </span>
            ))}
          </h1>
        </header>

        <ul className="portfolio-grid list-none p-0 m-0">
          {PROJECTS.map((project) => (
            <li key={project.title}>
              <figure>
                <div className={`portfolio-card ${project.bg} relative`}>
                  {project.video ? (
                    <video
                      className="absolute inset-[5%] w-[90%] h-[90%] object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                    >
                      <source src={project.video} type="video/mp4" />
                    </video>
                  ) : null}
                </div>
                <figcaption className="mt-4 flex items-baseline justify-between gap-4">
                  <h4 className="text-xl font-normal mb-0">{project.title}</h4>
                  <span className="text-(--muted) shrink-0">{project.year}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
