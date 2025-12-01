"use client";

import { FormEvent, FocusEvent, useEffect, useRef, useState } from "react";
import AnimatedHeadline from "@/components/animated-headline";
import SiteHeader from "@/components/site-header";
import Image from "next/image";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import { themedAsset } from "@/utils/themed-asset";
import Link from "next/link";

const UNLOCK_PASSWORD = "samsonite";

export default function WorkPage() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const theme = useTheme("light");
  const trmnlImage = themedAsset(
    "/images/trmnl-spotify-dashboard-mobile",
    theme,
    "png"
  );

  const handleUnlockAttempt = (input: string) => {
    const success = input.trim() === UNLOCK_PASSWORD;
    setIsUnlocked(success);
    setError(!success);
    if (success) {
      setPassword("");
      setShowInput(false);
    }
    return success;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleUnlockAttempt(password);
  };

  const revealInput = () => {
    setShowInput(true);
    setError(false);
  };

  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    if (!formRef.current) return;
    const next = event.relatedTarget as Node | null;
    if (!next || !formRef.current.contains(next)) {
      setShowInput(false);
      setPassword("");
      setError(false);
    }
  };

  useEffect(() => {
    if (!showInput || isUnlocked) return;
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (
        (formRef.current && formRef.current.contains(target)) ||
        (triggerRef.current && triggerRef.current.contains(target))
      ) {
        return;
      }
      setShowInput(false);
      setPassword("");
      setError(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showInput, isUnlocked]);

  return (
    <div className="max-w-8xl px-6 md:px-16 pt-20 md:pt-28 mx-auto transition-colors duration-650 ease-[cubic-bezier(0.25,0.8,0.35,1)]">
      <SiteHeader />

      <main className="pb-8 md:pb-16">
        <header className="my-12 md:my-16 flex items-center justify-between gap-4">
          <div className="max-w-5xl flex-1 min-w-0">
            <AnimatedHeadline className="font-semibold" text="Projects" />
          </div>

          <div className="flex items-center gap-3 md:gap-10 self-start md:self-center shrink-0">
            {showInput && !isUnlocked ? (
              <form
                ref={formRef}
                onSubmit={handleSubmit}
                onBlur={handleBlur}
                className="flex items-center gap-2 rounded-full px-3 py-2 text-sm bg-(--input-bg) backdrop-blur border border-(--border)"
              >
                <label htmlFor="work-password" className="sr-only">
                  Password
                </label>
                <input
                  id="work-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  className="bg-transparent outline-none placeholder:text-(--muted) text-(--fg) text-md w-full min-w-0"
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

            <button
              type="button"
              ref={triggerRef}
              onClick={revealInput}
              disabled={isUnlocked}
              className="h-12 w-12 rounded-full grid place-items-center border border-(--border) bg-[rgba(255,255,255,0.25)] hover:bg-[rgba(255,255,255,0.4)] transition-all drop-shadow-md cursor-pointer disabled:cursor-default hover:scale-105"
              aria-label={
                isUnlocked ? "Portfolio unlocked" : "Enter portfolio password"
              }
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
            </button>
          </div>
        </header>

        {error && !isUnlocked ? (
          <p className="text-sm text-red-500 mt-1 mb-4">
            Wrong password. Try again.
          </p>
        ) : null}

        <section className="portfolio-grid">
          <div className="group card-hover">
            <figure className="aspect-square rounded-3xl drop-shadow-xl overflow-hidden">
              <video
                controls
                muted
                loop
                playsInline
                className="h-full w-full object-cover card-media"
              >
                <source src="/videos/aura-rcs-dark.mp4" type="video/mp4" />
              </video>
            </figure>
            <figcaption>
              <h4>Aura RCS Messaging</h4>
              <span>
                Helping families share moments to their Aura frames even more
                seamlessly with rich messaging.
              </span>
            </figcaption>
          </div>
          <div className="group card-hover">
            <figure className="aspect-square rounded-3xl drop-shadow-xl overflow-hidden">
              <video
                controls
                muted
                loop
                playsInline
                className="h-full w-full object-cover card-media"
              >
                <source src="/videos/aura-product-video.mp4" type="video/mp4" />
              </video>
            </figure>
            <figcaption>
              <h4>Aura Captions</h4>
              <span>Photo captions to bring context to shared memories.</span>
            </figcaption>
          </div>
          {isUnlocked ? (
            <motion.div
              className="group card-hover"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.25, 0.8, 0.35, 1] }}
            >
              <figure className="aspect-square rounded-3xl drop-shadow-xl overflow-hidden">
                <video
                  controls
                  muted
                  loop
                  playsInline
                  className="h-full w-full object-cover card-media"
                >
                  <source src="/videos/waymo-my-car.webm" type="video/webm" />
                  <source src="/videos/waymo-my-car.mp4" type="video/mp4" />
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
            <div className="group card-hover">
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
                <h4>Confidential</h4>
                <span className="text-(--muted)">
                  Enter the password to view.
                </span>
              </figcaption>
            </div>
          )}
          <div className="group card-hover">
            <figure className="aspect-square rounded-3xl drop-shadow-xl overflow-hidden">
              <Image
                src="/images/skyteller-light.png"
                alt="Crypto"
                width={800}
                height={800}
                className="h-full w-full object-cover card-media"
                priority
              />
            </figure>
            <figcaption>
              <h4>Skyteller</h4>
              <span>
                Skyteller turned crypto into cash in just one click, to make the
                crypto world more accessible and user-friendly.
              </span>
            </figcaption>
          </div>
          <div className="group card-hover">
            <figure className="aspect-square rounded-3xl drop-shadow-xl overflow-hidden">
              <Image
                src="/images/braintree-dashboard.gif"
                alt="Braintree Control Panel"
                width={800}
                height={800}
                className="h-full w-full object-cover card-media"
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
        </section>

        <section className="mt-12">
          <h3 className="mb-6 text-3xl font-bold">Side Projects</h3>
          <div className="portfolio-grid">
            <Link
              href="/work/trmnl"
              className="group card-hover block rounded-3xl hover:opacity-95 transition-opacity"
            >
              <figure className="aspect-square rounded-3xl drop-shadow-xl overflow-hidden">
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
                <h4>TRMNL Spotify Plugin</h4>
                <span>
                  A Spotify recently played plugin for the TRMNL e-ink display.
                </span>
              </figcaption>
            </Link>
            <div className="group card-hover">
              <figure className="aspect-square rounded-3xl drop-shadow-xl overflow-hidden">
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
                <h4>Nutrition Coach</h4>
                <span>
                  I built a ChatGPT powered nutrition coach to help me lower my
                  A1C.
                </span>
              </figcaption>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <h3 className="mb-6 text-3xl font-bold">Articles</h3>
          <div className="portfolio-grid">
            <Link
              href="/work/daily-dispatch"
              className="group card-hover block rounded-3xl hover:opacity-95 transition-opacity"
            >
              <figure className="aspect-square rounded-3xl drop-shadow-xl overflow-hidden">
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
                <h4>Over-Engineered: Daily Dispatch</h4>
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
              <figure className="aspect-square rounded-3xl drop-shadow-xl overflow-hidden">
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
                <h4>Reverse Engineering: Connections</h4>
                <span>
                  I break down an existing experience with a technical focus.
                </span>
              </figcaption>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
