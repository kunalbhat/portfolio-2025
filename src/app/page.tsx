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
  const waymoVideoSrc = "/videos/waymo.mp4";
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
    <div className="max-w-8xl px-8 md:px-16 pt-20 md:pt-32 mx-auto transition-colors duration-650 ease-[cubic-bezier(0.25,0.8,0.35,1)]">
      <SiteHeader onUnlockAttempt={handleUnlockAttempt} unlocked={isUnlocked} />

      <main className="py-12 min-h-screen">
        <AnimatedHeadline
          className="mb-12 md:mb-16"
          text="Designing experiences that bring millions of families closer together."
        />
        <h2 className="mb-12 md:mb-24">
          At <a href="#">Aura</a>, I design for growth and lead product
          research.
        </h2>

        <section className="md:grid grid-cols-3 gap-10">
          <div>
            <figure className="aspect-square rounded-3xl drop-shadow-xl overflow-hidden">
              <video
                key={theme}
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover"
              >
                <source src={`${auraVideoBase}.webm`} type="video/webm" />
                <source src={`${auraVideoBase}.mp4`} type="video/mp4" />
              </video>
            </figure>
            <figcaption>
              <h3>Text to Frame</h3>
              <span>
                We made sending photos to Aura Frames beautifully simple with
                RCS and the Aura Agent.
              </span>
            </figcaption>
          </div>

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
              <h3>TRMNL Spotify Dashboard</h3>
              <span>
                Mobile dashboard concept tailored for the TRMNL commute
                experience.
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
                  <source src={waymoVideoSrc} type="video/mp4" />
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
              <figure className="aspect-square rounded-3xl drop-shadow-xl bg-gray-50 grid place-items-center px-6 text-center">
                <div className="flex flex-col items-center gap-3 text-(--muted) max-w-[18ch]">
                  <Image
                    src="/images/icon-lock.svg"
                    alt="Unlock"
                    width={32}
                    height={32}
                    className="h-8 w-8"
                  />
                  <p className="font-semibold text-(--fg)">Confidential</p>
                  <p className="text-sm max-w-[18ch]">
                    Unlock with the password to preview this work.
                  </p>
                </div>
              </figure>
              <figcaption>
                <h3>Private project</h3>
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
