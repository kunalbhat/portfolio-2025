"use client";

import Image from "next/image";
import AnimatedHeadline from "@/components/animated-headline";
import SiteHeader from "@/components/site-header";
import { useTheme } from "@/hooks/use-theme";
import { themedAsset } from "@/utils/themed-asset";
import React, { useRef, useState } from "react";
import { motion } from "framer-motion";

export default function Home() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const theme = useTheme("light");
  const auraVideoBase = themedAsset("/videos/aura-rcs", theme);
  const waymoVideoBase = "/videos/waymo-my-car";
  const trmnlImage = themedAsset(
    "/images/trmnl-spotify-dashboard-mobile",
    theme,
    "png"
  );
  const unlockPassword = "samsonite";
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [activeCase, setActiveCase] = useState(0);

  const handleUnlockAttempt = (password: string) => {
    const success = password.trim() === unlockPassword;
    setIsUnlocked(success);
    return success;
  };

  type CaseStudy = {
    key: string;
    title: string;
    description: string;
    renderMedia: () => React.ReactNode;
  };

  const caseStudies: CaseStudy[] = [
    {
      key: "text-to-frame",
      title: "Text to Frame",
      description:
        "We made sending photos to Aura Frames beautifully simple with RCS and the Aura Agent.",
      renderMedia: () => (
        <video
          key={`${auraVideoBase}-text-to-frame`}
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-cover"
        >
          <source src={`${auraVideoBase}.webm`} type="video/webm" />
          <source src={`${auraVideoBase}.mp4`} type="video/mp4" />
        </video>
      ),
    },
    {
      key: "captions",
      title: "Captions",
      description:
        "Captions add context to each photo, making memories feel more personal on the frame.",
      renderMedia: () => (
        <video
          key="aura-captions"
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-cover"
        >
          <source src="videos/aura-product-video.mp4" type="video/mp4" />
        </video>
      ),
    },
    isUnlocked
      ? {
          key: "waymo",
          title: "Waymo",
          description:
            "Exploring future mobility experiences with a focus on clear, calm in-car communication.",
          renderMedia: () => (
            <video
              key="waymo"
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
            >
              <source src={`${waymoVideoBase}.webm`} type="video/webm" />
              <source src={`${waymoVideoBase}.mp4`} type="video/mp4" />
            </video>
          ),
        }
      : {
          key: "confidential",
          title: "Confidential",
          description: "Enter the password to view.",
          renderMedia: () => (
            <div className="h-full w-full bg-(--bg-overlay) grid place-items-center px-6 text-center">
              <div className="flex flex-col items-center gap-3 text-(--muted) max-w-[18ch]">
                <Image
                  src="/images/icon-lock.svg"
                  alt="Locked"
                  width={32}
                  height={32}
                  className="h-8 w-8"
                />
                <p className="font-semibold text-(--fg) mb-0">Confidential</p>
              </div>
            </div>
          ),
        },
  ].filter(Boolean) as CaseStudy[];

  const scrollToIndex = (index: number) => {
    const container = carouselRef.current;
    if (!container) return;

    const clamped = Math.max(0, Math.min(caseStudies.length - 1, index));
    const target = container.children[clamped] as HTMLElement | undefined;
    if (!target) return;

    container.scrollTo({
      left: target.offsetLeft - container.clientLeft,
      behavior: "smooth",
    });
    setActiveCase(clamped);
  };

  const handleCarouselScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const container = event.currentTarget;
    const { scrollLeft } = container;
    let closestIndex = 0;
    let smallestDistance = Number.POSITIVE_INFINITY;

    Array.from(container.children).forEach((child, index) => {
      const element = child as HTMLElement;
      const distance = Math.abs(element.offsetLeft - scrollLeft);
      if (distance < smallestDistance) {
        smallestDistance = distance;
        closestIndex = index;
      }
    });

    if (closestIndex !== activeCase) {
      setActiveCase(closestIndex);
    }
  };

  return (
    <div className="max-w-8xl px-6 md:px-16 pt-20 md:pt-28 mx-auto transition-colors duration-650 ease-[cubic-bezier(0.25,0.8,0.35,1)]">
      <SiteHeader onUnlockAttempt={handleUnlockAttempt} unlocked={isUnlocked} />

      <main className="py-8 min-h-screen">
        <AnimatedHeadline
          className="mb-12 md:mb-16"
          text="Designing experiences that bring millions of families closer together."
        />
        <h2 className="mb-12 md:mb-24 ">
          At{" "}
          <a href="https://www.auraframes.com" target="_blank">
            Aura
          </a>
          , I lead growth initiatives and product research—driving big-swing
          concepts, continuous customer insight, and rapid experimentation to
          ship high-impact features at scale.
        </h2>
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-semibold">Selected work</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => scrollToIndex(activeCase - 1)}
                className="h-10 w-10 rounded-full border border-(--border) grid place-items-center text-(--fg) hover:bg-(--bg-overlay) transition-colors"
                aria-label="Previous project"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => scrollToIndex(activeCase + 1)}
                className="h-10 w-10 rounded-full border border-(--border) grid place-items-center text-(--fg) hover:bg-(--bg-overlay) transition-colors"
                aria-label="Next project"
              >
                ›
              </button>
            </div>
          </div>

          <div
            ref={carouselRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-px-6 pb-4 no-scrollbar"
            onScroll={handleCarouselScroll}
          >
            {caseStudies.map((item, index) => (
              <div
                key={item.key}
                className="min-w-[90vw] md:min-w-[70vw] lg:min-w-[60vw] snap-start"
              >
                <div className="rounded-3xl overflow-hidden border border-(--border) bg-(--bg-overlay) drop-shadow-xl md:grid md:grid-cols-[1.2fr_1fr]">
                  <figure className="relative aspect-[3/2] md:aspect-auto md:h-full">
                    {item.renderMedia()}
                  </figure>
                  <div className="flex flex-col justify-center gap-4 px-6 py-8 md:px-10 bg-[color-mix(in_srgb,var(--bg)92%,transparent)]">
                    <h3 className="text-2xl md:text-3xl font-semibold leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-lg md:text-xl text-(--muted)">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-(--muted)">
                        {index + 1}/{caseStudies.length}
                      </span>
                      <div className="flex gap-2">
                        {caseStudies.map((_, dotIndex) => (
                          <span
                            key={dotIndex}
                            className={`h-2 w-2 rounded-full transition-all duration-300 ${
                              dotIndex === activeCase
                                ? "bg-(--fg) scale-100"
                                : "bg-(--border) scale-90 opacity-70"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="mt-20 mb-24 max-w-5xl mx-auto">
          <div className="rounded-4xl overflow-hidden border border-(--border) bg-(--bg-overlay) drop-shadow-xl md:grid md:grid-cols-[1.2fr_1fr]">
            <figure className="relative aspect-3/2 md:aspect-auto md:h-full">
              <video
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover"
              >
                <source src="videos/aura-product-video.mp4" type="video/mp4" />
              </video>
            </figure>

            <div className="flex flex-col justify-center gap-4 px-6 py-10 md:px-12 bg-[color-mix(in_srgb,var(--bg)90%,transparent)]">
              <h3>Captions for Aura Frames</h3>
              <p>
                Adding captions to photos makes memories feel more personal on
                the frame. I led the end-to-end design and research process for
                this feature—from initial concepting to user testing to final
                implementation.
              </p>
            </div>
          </div>
        </section>
        <header className="mb-8">
          <h2>Showcase</h2>
          <p className="text-xl">Previous work and personal projects.</p>
        </header>
        <section className="portfolio-grid">
          <div>
            <figure className="aspect-square rounded-3xl drop-shadow-xl overflow-hidden">
              <Image
                src={trmnlImage}
                alt="Spotify dashboard for TRMNL"
                width={800}
                height={800}
                className="h-full w-full object-cover"
                priority
              />
            </figure>
            <figcaption>
              <h3>TRMNL Spotify Plugin</h3>
              <span>
                A Spotify recently played plugin for the TRMNL e-ink display.
              </span>
            </figcaption>
          </div>
          <div>
            <figure className="aspect-square rounded-3xl drop-shadow-xl overflow-hidden">
              <Image
                src="/images/braintree-dashboard.gif"
                alt="Braintree Control Panel"
                width={800}
                height={800}
                className="h-full w-full object-cover"
                priority
                unoptimized
              />
            </figure>
            <figcaption>
              <h3>Braintree Control Panel</h3>
              <span>
                I led the redesign of Braintree&apos;s merchant dashboard.
              </span>
            </figcaption>
          </div>

          {isUnlocked ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.25, 0.8, 0.35, 1] }}
            >
              <figure className="aspect-square rounded-3xl drop-shadow-xl overflow-hidden">
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="h-full w-full object-cover"
                >
                  <source src={`${waymoVideoBase}.webm`} type="video/webm" />
                  <source src={`${waymoVideoBase}.mp4`} type="video/mp4" />
                </video>
              </figure>
              <figcaption>
                <h3>Waymo</h3>
                <span>
                  Exploring future mobility experiences with a focus on clear,
                  calm in-car communication.
                </span>
              </figcaption>
            </motion.div>
          ) : (
            <div>
              <figure className="aspect-square rounded-3xl drop-shadow-xl bg-(--bg-overlay) grid place-items-center px-6 text-center">
                <div className="flex flex-col items-center gap-3 text-(--muted) max-w-[18ch]">
                  <Image
                    src="/images/icon-lock.svg"
                    alt="Locked"
                    width={32}
                    height={32}
                    className="h-8 w-8"
                  />
                  <p className="font-semibold text-(--fg) mb-0">Confidential</p>
                </div>
              </figure>
              <figcaption>
                <h3>Confidential</h3>
                <span className="text-(--muted)">
                  Enter the password to view.
                </span>
              </figcaption>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
