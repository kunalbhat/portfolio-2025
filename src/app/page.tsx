"use client";

import Image from "next/image";
import AnimatedHeadline from "@/components/animated-headline";
import SiteHeader from "@/components/site-header";
import { useTheme } from "@/hooks/use-theme";
import { themedAsset } from "@/utils/themed-asset";
import { useState } from "react";
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

  const handleUnlockAttempt = (password: string) => {
    const success = password.trim() === unlockPassword;
    setIsUnlocked(success);
    return success;
  };

  return (
    <div className="max-w-8xl px-6 md:px-16 pt-20 md:pt-28 mx-auto transition-colors duration-650 ease-[cubic-bezier(0.25,0.8,0.35,1)]">
      <SiteHeader onUnlockAttempt={handleUnlockAttempt} unlocked={isUnlocked} />

      <main className="py-8 min-h-screen">
        <header className="max-w-6xl my-8 md:mb-16">
          <AnimatedHeadline
            className="mb-12 md:mb-16"
            text="Kunal Bhat, Product Designer"
          />
          <h2 className="mb-12 md:mb-24 ">
            Currently at{" "}
            <a href="https://www.auraframes.com" target="_blank">
              Aura
            </a>
            , building photo-sharing experiences that bring <em>millions</em> of
            families closer together.
          </h2>
        </header>
        <section className="mt-20 mb-24">
          <div className="md:grid md:grid-cols-[1.2fr_1fr]">
            <figure className="rounded-3xl overflow-hidden relative h-96 border border-(--border) bg-(--bg-overlay) drop-shadow-xl">
              <video
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-contain"
              >
                <source src="videos/aura-rcs-light.mp4" type="video/mp4" />
              </video>
            </figure>

            <div className="flex flex-col justify-center gap-4 px-6 py-10 md:px-12 bg-[color-mix(in_srgb,var(--bg)90%,transparent)]">
              <h3>Aura Frames</h3>
              <p>
                As a Staff Product Designer, I design for growth initiatives and
                lead product research—driving big-swing concepts, continuous
                customer insight, and rapid experimentation to ship high-impact
                features at scale.
              </p>
            </div>
          </div>
        </section>
        <header className="mb-8">
          <h3>Showcase</h3>
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
              <h4>TRMNL Spotify Plugin</h4>
              <span>
                A Spotify recently played plugin for the TRMNL e-ink display.
              </span>
            </figcaption>
          </div>
          <div>
            <figure className="aspect-square rounded-3xl drop-shadow-xl overflow-hidden">
              <Image
                src="/images/skyteller-light.png"
                alt="Crypto"
                width={800}
                height={800}
                className="h-full w-full object-cover"
                priority
              />
            </figure>
            <figcaption>
              <h4>Skyteller</h4>
              <span>Crypto off-ramp.</span>
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
              <h4>Braintree Control Panel</h4>
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
                <h4>Waymo</h4>
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
