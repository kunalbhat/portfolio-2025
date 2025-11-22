"use client";

import AnimatedHeadline from "@/components/animated-headline";
import SiteHeader from "@/components/site-header";

export default function Home() {
  return (
    <div className="max-w-8xl px-8 md:px-16 pt-28 md:pt-32 mx-auto transition-colors duration-650 ease-[cubic-bezier(0.25,0.8,0.35,1)]">
      <SiteHeader />

      <main className="py-12 min-h-screen">
        <AnimatedHeadline
          className="mb-12 md:mb-24"
          text="Designing experiences that bring millions of families closer."
        />
        <h2 className="mb-12 md:mb-24">
          Currently at Aura, I design for growth and lead product research.
        </h2>

        <section className="grid grid-cols-3">
          <div>
            <figure>
              <video
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-auto rounded-3xl drop-shadow-xl"
              >
                <source src="/videos/aura-rcs.webm" type="video/webm" />
                <source src="/videos/aura-rcs.mp4" type="video/mp4" />
              </video>
            </figure>
            <figcaption>
              Text to frame makes it easier than ever to share photos to your
              Aura Frames. Powered by RCS.
            </figcaption>
          </div>
        </section>
      </main>
    </div>
  );
}
