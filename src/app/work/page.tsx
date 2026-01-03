"use client";

import { FormEvent, useMemo, useState } from "react";
import AnimatedHeadline from "@/components/animated-headline";
import SiteHeader from "@/components/site-header";
import Image from "next/image";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import { themedAsset } from "@/utils/themed-asset";
import Link from "next/link";
import { track } from "@vercel/analytics";

export default function WorkPage() {
  const UNLOCK_PASSWORD = useMemo(
    () => process.env.NEXT_PUBLIC_WORK_PASSWORD || "",
    []
  );
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const theme = useTheme("light");
  const invertedTheme = theme === "light" ? "dark" : "light";
  const auraRcsVideoMp4 = themedAsset("/videos/aura-rcs", invertedTheme, "mp4");
  const auraRcsVideoWebm = themedAsset(
    "/videos/aura-rcs",
    invertedTheme,
    "webm"
  );
  const trmnlImage = themedAsset(
    "/images/trmnl-spotify-dashboard-mobile",
    invertedTheme,
    "png"
  );

  const handleUnlockAttempt = (input: string) => {
    if (!UNLOCK_PASSWORD) {
      setError(true);
      return false;
    }
    const success = input.trim() === UNLOCK_PASSWORD;
    setIsUnlocked(success);
    setError(!success);
    if (success) {
      setPassword("");
      track("work_unlock_success");
    } else {
      track("work_unlock_failure");
    }
    return success;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleUnlockAttempt(password);
  };

  return (
    <div className="page-container">
      <SiteHeader />

      <main className="pb-8 md:pb-16">
        <header className="my-12 md:my-16 flex flex-col md:flex-row md:items-center md:justify-between gap-4 w-full">
          <div className="max-w-5xl flex-1 min-w-0 w-full">
            <AnimatedHeadline className="font-semibold" text="Projects" />
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4 self-start md:self-center shrink-0 w-full md:w-auto">
            {!isUnlocked ? (
              <form
                onSubmit={handleSubmit}
                className="work-password-form flex items-center gap-2 rounded-full px-3 py-2 text-sm bg-(--input-bg) backdrop-blur w-full md:w-auto"
              >
                <label htmlFor="work-password" className="sr-only">
                  Password
                </label>
                <input
                  id="work-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter password"
                  className="bg-transparent outline-none placeholder:text-(--muted) text-(--fg) text-lg w-full min-w-0 px-1.5 py-1"
                  autoComplete="off"
                  spellCheck={false}
                  data-1p-ignore
                />
                <button
                  type="submit"
                  className="px-3 py-1 rounded-full bg-(--fg) text-(--bg) font-medium hover:opacity-90 transition-opacity"
                >
                  Unlock
                </button>
              </form>
            ) : null}

            <div
              className="h-12 w-12 rounded-full hidden md:grid place-items-center border border-(--border) bg-[rgba(255,255,255,0.25)]"
              aria-label={
                isUnlocked ? "Portfolio unlocked" : "Portfolio locked"
              }
              role="status"
            >
              <Image
                src={
                  isUnlocked
                    ? "/images/icon-unlock.svg"
                    : "/images/icon-lock.svg"
                }
                alt={isUnlocked ? "Unlocked" : "Locked"}
                width={32}
                height={32}
                className="h-7 w-7 lock-icon"
                priority
              />
            </div>
          </div>
        </header>

        {error && !isUnlocked ? (
          <p className="text-sm text-red-500 mt-1 mb-4">
            Wrong password. Try again.
          </p>
        ) : null}

        <section className="portfolio-grid">
          <div className="group card-hover block rounded-3xl hover:opacity-95 transition-opacity cursor-default">
            <figure className="portfolio-card relative">
              <video
                key={auraRcsVideoMp4}
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover card-media"
              >
                <source src={auraRcsVideoWebm} type="video/webm" />
                <source src={auraRcsVideoMp4} type="video/mp4" />
              </video>
              <div className="coming-soon-overlay">
                <span className="coming-soon-pill">Coming Soon</span>
              </div>
            </figure>
            <figcaption>
              <h4>Aura Text-to-Frame</h4>
              <span>
                Helping families share moments to their Aura frames even more
                seamlessly with rich messaging.
              </span>
            </figcaption>
          </div>
          <div className="group card-hover block rounded-3xl hover:opacity-95 transition-opacity cursor-default">
            <figure className="portfolio-card relative">
              <video
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover card-media"
              >
                <source src="/videos/aura-product-video.mp4" type="video/mp4" />
              </video>
              <div className="coming-soon-overlay">
                <span className="coming-soon-pill">Coming Soon</span>
              </div>
            </figure>
            <figcaption>
              <h4>Aura Captions</h4>
              <span>
                From 0 → millions of photo captions, I launched a brand new
                multi-surface experience that let Aura users add context to
                cherished memories.
              </span>
            </figcaption>
          </div>
          {isUnlocked ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.25, 0.8, 0.35, 1] }}
            >
              <div className="group card-hover block rounded-3xl hover:opacity-95 transition-opacity cursor-default">
                <figure className="portfolio-card relative">
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="h-full w-full object-cover card-media"
                  >
                    <source src="/videos/waymo-my-car.webm" type="video/webm" />
                    <source src="/videos/waymo-my-car.mp4" type="video/mp4" />
                  </video>
                  <div className="coming-soon-overlay">
                    <span className="coming-soon-pill">Coming Soon</span>
                  </div>
                </figure>
                <figcaption>
                  <h4>Waymo</h4>
                  <span>
                    Explored rider sentiment on personalization and in-car
                    preferences - resulting in the new My Car tab in the Waymo
                    app.
                  </span>
                </figcaption>
              </div>
            </motion.div>
          ) : (
            <div className="group card-hover">
              <figure className="portfolio-card bg-(--bg-overlay) grid place-items-center px-6 text-center">
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
                <h4>Confidential</h4>
                <span className="text-(--muted)">
                  Enter the password to view.
                </span>
              </figcaption>
            </div>
          )}
          <div className="group card-hover block rounded-3xl hover:opacity-95 transition-opacity cursor-default">
            <figure className="portfolio-card relative">
              <Image
                src="/images/skyteller-light.png"
                alt="Crypto"
                width={800}
                height={800}
                className="h-full w-full object-cover card-media"
                priority
              />
              <div className="coming-soon-overlay">
                <span className="coming-soon-pill">Coming Soon</span>
              </div>
            </figure>
            <figcaption>
              <h4>Skyteller</h4>
              <span>
                As an engineer, I helped build Skyteller a Defi off-ramp that
                turned crypto into cash in your bank account in one click.
              </span>
            </figcaption>
          </div>
          <div className="group card-hover block rounded-3xl hover:opacity-95 transition-opacity cursor-default">
            <figure className="portfolio-card relative">
              <Image
                src="/images/braintree-dashboard.gif"
                alt="Braintree Control Panel"
                width={800}
                height={800}
                className="h-full w-full object-cover card-media"
                priority
                unoptimized
              />
              <div className="coming-soon-overlay">
                <span className="coming-soon-pill">Coming Soon</span>
              </div>
            </figure>
            <figcaption>
              <h4>Braintree Control Panel</h4>
              <span>
                As a PM, I led the redesign of Braintree&apos;s merchant
                dashboard used by companies like Uber and Airbnb to manage their
                payments.
              </span>
            </figcaption>
          </div>
        </section>

        <section className="mt-12">
          <header className="mb-6 md:mb-10">
            <h3 className="text-3xl font-bold">Explorations</h3>
            <p className="text-lg">
              Experiments that showcase my passion for various aspects of the
              design process.
            </p>
          </header>
          <div className="portfolio-grid-compact">
            <Link
              href="/work/trmnl"
              className="group card-hover block rounded-3xl hover:opacity-95 transition-opacity"
            >
              <figure className="portfolio-card-compact">
                <Image
                  src={trmnlImage}
                  alt="Spotify dashboard for TRMNL"
                  width={800}
                  height={800}
                  className="h-full w-full object-cover card-media"
                  priority
                />
              </figure>
              <figcaption>
                <h4 className="compact-card-title">TRMNL Spotify Plugin</h4>
                <span>
                  A Spotify recently played plugin for the TRMNL e-ink display.
                </span>
              </figcaption>
            </Link>
            <Link
              href="/work/nutrition-coach"
              className="group card-hover block rounded-3xl hover:opacity-95 transition-opacity"
            >
              <figure className="portfolio-card-compact">
                <Image
                  src="/images/a1c-tracker-mobile-light.jpg"
                  alt="A1C tracker mobile UI"
                  width={800}
                  height={800}
                  className="h-full w-full object-cover card-media"
                  priority
                />
              </figure>
              <figcaption>
                <h4 className="compact-card-title">Nutrition Coach</h4>
                <span>
                  I built a ChatGPT powered nutrition coach to help lower my
                  A1C.
                </span>
              </figcaption>
            </Link>
            <Link
              href="/work/daily-dispatch"
              className="group card-hover block rounded-3xl hover:opacity-95 transition-opacity"
            >
              <figure className="portfolio-card-compact">
                <Image
                  src="/images/daily-dispatch.jpg"
                  alt="Over-Engineered — Daily Dispatch cover"
                  width={800}
                  height={800}
                  className="h-full w-full object-cover card-media"
                  priority
                />
              </figure>
              <figcaption>
                <h4 className="compact-card-title">Over-Engineered: Daily Dispatch</h4>
                <span>
                  I design a hypothetical app end-to-end based on a workflow
                  problem.
                </span>
              </figcaption>
            </Link>
            <Link
              href="/work/connections"
              className="group card-hover block rounded-3xl hover:opacity-95 transition-opacity"
            >
              <figure className="portfolio-card-compact">
                <Image
                  src="/images/reverse-engineering.jpg"
                  alt="Reverse Engineering - Connections cover"
                  width={800}
                  height={800}
                  className="h-full w-full object-cover card-media"
                  priority
                />
              </figure>
              <figcaption>
                <h4 className="compact-card-title">Reverse Engineering: Connections</h4>
                <span>
                  I break down an existing experience with a technical focus.
                </span>
              </figcaption>
            </Link>
            <Link
              href="/work/maze-of-games"
              className="group card-hover block rounded-3xl hover:opacity-95 transition-opacity"
            >
              <figure className="portfolio-card-compact">
                <Image
                  src="https://raw.githubusercontent.com/kunalbhat/maze-of-games/master/puzzle_1/screenshots/puzzle_1_interface.png"
                  alt="Maze of Games - Puzzle interface"
                  width={800}
                  height={800}
                  className="h-full w-full object-cover card-media"
                  priority
                />
              </figure>
              <figcaption>
                <h4 className="compact-card-title">Maze of Games (2016)</h4>
                <span>
                  Interactive puzzle interfaces inspired by the Maze of Games
                  novel.
                </span>
              </figcaption>
            </Link>
            <Link
              href="/work/freddie-alerts"
              className="group card-hover block rounded-3xl hover:opacity-95 transition-opacity"
            >
              <figure className="portfolio-card-compact bg-[#e8f3ff]">
                <Image
                  src="https://raw.githubusercontent.com/kunalbhat/replyall-scraper/master/screenshots/all_gone.png"
                  alt="Freddie Alerts - Giveaway watcher"
                  width={800}
                  height={800}
                  className="h-full w-full object-contain card-media"
                  priority
                />
              </figure>
              <figcaption>
                <h4 className="compact-card-title">Freddie Alerts (2016)</h4>
                <span>
                  Small Ruby web-scraping utility for Mailchimp giveaways.
                </span>
              </figcaption>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
