"use client";

import { FormEvent, useState } from "react";
import AnimatedHeadline from "@/components/animated-headline";
import SiteHeader from "@/components/site-header";
import Image from "next/image";
import { motion } from "framer-motion";

const UNLOCK_PASSWORD = "samsonite";

export default function WorkPage() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleUnlockAttempt = (input: string) => {
    const success = input.trim() === UNLOCK_PASSWORD;
    setIsUnlocked(success);
    setError(!success);
    if (success) {
      setPassword("");
    }
    return success;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleUnlockAttempt(password);
  };

  return (
    <div className="max-w-8xl px-6 md:px-16 pt-20 md:pt-28 mx-auto transition-colors duration-650 ease-[cubic-bezier(0.25,0.8,0.35,1)]">
      <SiteHeader />

      <main className="py-12 min-h-screen">
        <header className="max-w-5xl mb-16">
          <AnimatedHeadline className="mb-6" text="Selected Work" />
          <p className="text-lg text-(--muted)">
            Password-protected explorations and in-progress pieces.
          </p>
        </header>

        <section className="mb-12">
          <form
            onSubmit={handleSubmit}
            className="flex flex-wrap items-center gap-3 rounded-2xl border border-(--border) bg-(--bg-overlay) px-4 py-3 md:px-5 md:py-4 drop-shadow-sm"
          >
            <label htmlFor="work-password" className="text-sm font-semibold">
              Enter password
            </label>
            <input
              id="work-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              className="flex-1 min-w-[160px] md:min-w-[220px] bg-transparent outline-none placeholder:text-(--muted) text-(--fg) text-base border border-(--border) rounded-full px-4 py-2"
              autoComplete="off"
              spellCheck={false}
              data-1p-ignore
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-full bg-(--fg) text-(--bg) font-semibold hover:opacity-90 transition-opacity"
            >
              Unlock
            </button>
            {isUnlocked ? (
              <span className="text-sm text-green-500 font-semibold">
                Unlocked
              </span>
            ) : null}
          </form>
          {error && !isUnlocked ? (
            <p className="text-sm text-red-500 mt-2">Wrong password. Try again.</p>
          ) : null}
        </section>

        <section className="portfolio-grid">
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
            <div>
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
                <h3>Confidential</h3>
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
