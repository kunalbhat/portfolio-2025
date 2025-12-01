"use client";

import AnimatedHeadline from "@/components/animated-headline";
import SiteHeader from "@/components/site-header";
import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-8xl px-6 md:px-16 pt-20 md:pt-28 mx-auto transition-colors duration-650 ease-[cubic-bezier(0.25,0.8,0.35,1)]">
      <SiteHeader />

      <main className="py-8 min-h-screen">
        <header className="max-w-8xl my-8 md:mb-16">
          <AnimatedHeadline
            className="my-16 md:mt-16 md:mb-24 font-semibold"
            text="Hi, I'm Kunal - a product designer with PM and engineering experience."
          />
          <h2 className="mb-12 md:mb-24">
            Currently at{" "}
            <a href="https://www.auraframes.com" target="_blank">
              Aura
            </a>{" "}
            &mdash; building photo-sharing experiences that bring{" "}
            <em>millions</em> of families closer together.
          </h2>
        </header>

        <section className="md:grid grid-cols-3">
          <div className="col-span-1">
            <h4>Mini Bio</h4>
          </div>
          <div className="col-span-1">
            <p>
              Designer with two decades of experience building experiences at
              startups to enterprise.
            </p>
            <p>
              <Link href="/about">Learn more about me</Link>
            </p>
          </div>
        </section>

        <section className="mt-20 mb-24">
          <div className="md:grid md:grid-cols-[1.2fr_1fr]">
            <figure className="rounded-3xl overflow-hidden relative aspect-video border border-(--border) bg-(--bg) drop-shadow-xl">
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
              <h4>Aura Frames</h4>
              <p>
                As a Staff Product Designer, I design for growth initiatives and
                lead product research—driving big-swing concepts, continuous
                customer insight, and rapid experimentation to ship high-impact
                features at scale.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
