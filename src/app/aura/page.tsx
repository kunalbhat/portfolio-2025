"use client";

import Image from "next/image";
import SiteHeader from "@/components/site-header";

export default function AuraPage() {
  return (
    <div className="max-w-8xl px-6 md:px-16 pt-20 md:pt-28 mx-auto transition-colors duration-650 ease-[cubic-bezier(0.25,0.8,0.35,1)]">
      <SiteHeader />

      <main className="py-10 md:py-14 min-h-screen space-y-10">
        <header className="space-y-4">
          <h1 className="text-4xl md:text-6xl mb-8 md:mb-12 font-semibold">
            Design at Aura
          </h1>
          <div className="feature-figure">
            <Image
              src="/images/aura-bluetooth-experiment.jpg"
              alt="Aura experimentation cover"
              width={1600}
              height={900}
              className="w-full h-full object-contain"
              priority
            />
          </div>

          <p className="text-lg md:text-xl text-(--muted) max-w-3xl">
            Notes on the work I do at Aura: multi-variant experimentation,
            continuous user research, and new experience concepts that keep
            families sharing more often.
          </p>
        </header>
      </main>
    </div>
  );
}
