"use client";

import AnimatedHeadline from "@/components/animated-headline";
import SiteHeader from "@/components/site-header";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="max-w-8xl px-6 md:px-16 pt-20 md:pt-28 mx-auto transition-colors duration-650 ease-[cubic-bezier(0.25,0.8,0.35,1)]">
      <SiteHeader />

      <main className="py-8 min-h-screen">
        <header className="max-w-8xl my-8 md:mb-16">
          <AnimatedHeadline
            className="my-16 md:mt-16 md:mb-24 font-semibold"
            text="Hi, I'm Kunal - a product designer with PM and engineering experience."
            highlightedWords={{
              PM: "5 years as a product manager at PayPal and Braintree.",
              engineering: "2 years integrating with crypto tools at Galactic.",
            }}
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

        <section className="mb-24">
          <figure className="feature-figure aspect-square sm:aspect-video flex">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-contain"
            >
              <source src="videos/aura-product-video.mp4" type="video/mp4" />
            </video>
            <video
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-fit object-contain"
            >
              <source src="videos/aura-rcs-light.mp4" type="video/mp4" />
            </video>
          </figure>
        </section>

        <section className="md:grid grid-cols-3 my-16">
          <div className="col-span-1">
            <h4>Mini Bio</h4>
          </div>
          <div className="col-span-2">
            <p className="mb-4">
              Experienced enough to lead, hands-on enough to build. Senior IC
              with 18 years spanning design, product, and engineering.
            </p>
            <p>
              Previously at Magic+Might, Galactic, PayPal, Braintree, Modest,
              dscout, gravitytank, VSA Partners.
            </p>
            <p className="flex my-4 gap-4">
              Learn more about me
              <Link
                href="/about"
                className="flex items-center justify-center rounded-full h-10 w-10"
              >
                <Image
                  src="/images/icon-arrow-forward.svg"
                  alt="Forward arrow icon"
                  width={32}
                  height={32}
                  className="hover:translate-x-1 transition-transform duration-300"
                />
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
