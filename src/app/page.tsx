"use client";

import AnimatedHeadline from "@/components/animated-headline";
import SiteHeader from "@/components/site-header";
import { useTheme } from "@/hooks/use-theme";
import { themedAsset } from "@/utils/themed-asset";

export default function Home() {
  const theme = useTheme("light");
  const auraVideoBase = themedAsset("/videos/aura-rcs", theme);

  return (
    <div className="max-w-8xl px-8 md:px-16 pt-28 md:pt-32 mx-auto transition-colors duration-650 ease-[cubic-bezier(0.25,0.8,0.35,1)]">
      <SiteHeader />

      <main className="py-12 min-h-screen">
        <AnimatedHeadline
          className="mb-12 md:mb-16"
          text="Designing experiences that bring millions of families closer together."
        />
        <h2 className="mb-12 md:mb-24">
          At <a href="#">Aura</a>, I design for growth and lead product
          research.
        </h2>

        <section className="md:grid grid-cols-3">
          <div>
            <figure>
              <video
                key={theme}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-auto rounded-3xl drop-shadow-xl"
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
        </section>
      </main>
    </div>
  );
}
