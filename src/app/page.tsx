"use client";

import AnimatedHeadline from "@/components/animated-headline";
import SiteHeader from "@/components/site-header";

export default function Home() {
  return (
    <div className="max-w-8xl px-8 md:px-16 pt-28 md:pt-32 mx-auto transition-colors duration-[650ms] ease-[cubic-bezier(0.25,0.8,0.35,1)]">
      <SiteHeader />

      <main className="py-12 min-h-screen">
        <AnimatedHeadline
          className="mb-12 md:mb-24"
          text="Product designer with 20 years of experience in roles as a designer, PM, and engineer."
        />
        <h2>
          Currently at <a href="#">Aura</a> building experiences that bring
          millions of families closer together.
        </h2>

        <section>
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-auto rounded-lg"
          >
            <source src="/videos/aura-rcs.webm" type="video/webm" />
            <source src="/videos/aura-rcs.mp4" type="video/mp4" />
          </video>
        </section>
      </main>
    </div>
  );
}
