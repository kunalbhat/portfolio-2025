"use client";

import Image from "next/image";
import SiteHeader from "@/components/site-header";
import WorkDetailLayout from "@/components/work-detail-layout";

export default function TrmnlCaseStudyPage() {
  return (
    <div className="max-w-4xl px-6 md:px-16 pt-20 md:pt-28 mx-auto transition-colors duration-650 ease-[cubic-bezier(0.25,0.8,0.35,1)]">
      <SiteHeader />
      <main className="py-10 md:py-14 min-h-screen">
        <WorkDetailLayout title="TMRNL - Spotify “Recently played” Dashboard">
          <figure className="mb-8">
            <Image
              src="/images/trmnl-spotify-dashboard-mobile-light.png"
              alt="Screenshot 2025-07-15 at 9.41.03 AM.png"
              width={1200}
              height={900}
              className="w-full h-auto rounded-2xl border border-(--border) bg-(--bg-overlay)"
              priority
            />
          </figure>

          <section className="space-y-4">
            <p>
              Over the weekend, I explored TRMNL&apos;s private plugin system
              and built a small app that pulls data from my Spotify account and
              displays it on my TRMNL dashboard.
            </p>
            <p>
              Originally, we wanted to show “Now Playing” info in real time. But
              between:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Spotify not offering webhooks,</li>
              <li>TRMNL&apos;s (reasonable) rate limits for inbound data,</li>
              <li>
                and the polling overhead of asking for current playback every
                few minutes…
              </li>
            </ul>
            <p>…it quickly became clear that wasn&apos;t the right fit.</p>
            <p>
              Instead, we pivoted toward something better suited for a
              semi-static screen: a <strong>recently played album wall</strong>.
              My TRMNL now fetches my latest tracks via a public JSON endpoint
              that I host, and displays a grid of the album covers, along with
              track and artist info.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-xl md:text-2xl font-semibold">How it works:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>
                A{" "}
                <a href="https://github.com/kunalbhat/trmnl-spotify-server">
                  Node.js serverless function
                </a>{" "}
                runs on Vercel.
              </li>
              <li>
                It uses the Spotify API to fetch recently played tracks (up to
                10).
              </li>
              <li>It formats that data into TRMNL&apos;s expected schema.</li>
              <li>
                TRMNL polls the endpoint directly (no webhooks!) and renders the
                data in a screen layout I configured.
              </li>
              <li>
                Album art, artist names, and basic metadata, and the display
                updates passively as I listen.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-xl md:text-2xl font-semibold">
              Why I like this approach:
            </h3>
            <ul className="list-disc list-inside space-y-1">
              <li>
                No need to keep a server running or manage polling logic thanks
                to TRMNL&apos;s built-in data fetching strategies.
              </li>
              <li>
                Easy to reason about: all data lives in a super clean JSON
                endpoint.
              </li>
              <li>
                It feels ambient and personal: a musical footprint that evolves
                naturally through the day.
              </li>
            </ul>
          </section>

          <section className="space-y-3 max-w-xl mx-auto">
            <div className="rounded-2xl border border-(--border) bg-(--bg-overlay) p-4 md:p-6 space-y-3 shadow-2xl">
              <figure>
                <Image
                  src="/images/trmnl-repost.jpg"
                  alt="TRMNL social repost of the Spotify dashboard"
                  width={1400}
                  height={1000}
                  className="w-full h-auto rounded-xl border border-(--border)"
                />
              </figure>
              <figcaption>
                TRMNL gave the project a boost on social—fun to see it land with
                their community.
              </figcaption>
            </div>
          </section>

          <section className="space-y-4">
            <p>
              Big thanks to the TRMNL team for building a platform that&apos;s
              this easy to extend.
            </p>
            <p>
              You can explore the open-source server here →{" "}
              <a
                href="https://github.com/kunalbhat/trmnl-spotify-server"
                className="underline underline-offset-4"
              >
                github.com/kunalbhat/trmnl-spotify-server
              </a>
            </p>
          </section>
        </WorkDetailLayout>
      </main>
    </div>
  );
}
