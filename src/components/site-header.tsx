"use client";

import Image from "next/image";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "framer-motion";
import ThemeToggle from "@/components/theme-toggle";
import { FocusEvent, FormEvent, useRef, useState } from "react";

type SiteHeaderProps = {
  onUnlockAttempt: (password: string) => boolean;
  unlocked: boolean;
};

export default function SiteHeader({
  onUnlockAttempt,
  unlocked,
}: SiteHeaderProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (value) => {
    setIsAtTop(value < 40);
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const success = onUnlockAttempt(password);
    setError(!success);
    if (success) {
      setPassword("");
      setShowInput(false);
    }
  };

  const revealInput = () => {
    setShowInput(true);
    setError(false);
    requestAnimationFrame(() => inputRef.current?.focus());
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

  const iconShouldShift = showInput && !unlocked;

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-30 site-header"
      initial={false}
      animate={{
        opacity: isAtTop ? 1 : 0,
        y: isAtTop ? 0 : -12,
        pointerEvents: isAtTop ? "auto" : "none",
      }}
      transition={{ duration: 0.35, ease: [0.25, 0.8, 0.35, 1] }}
    >
      <div className="max-w-8xl mx-auto px-6 md:px-16">
        <div className="flex items-center justify-between py-6 md:py-8">
          <div className="flex items-center gap-6 md:gap-10">
            <motion.div
              className={`flex items-center gap-4 transform-gpu transition-all duration-400 ease-[cubic-bezier(0.25,0.8,0.35,1)] ${
                showInput
                  ? "-translate-x-full opacity-0 md:translate-x-0 md:opacity-100"
                  : "translate-x-0 opacity-100"
              }`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <motion.div
                className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-(--accent) flex items-center justify-center shrink-0 overflow-hidden"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{
                  scale: [0.7, 1.06, 0.98, 1],
                  opacity: [0, 1, 1, 1],
                }}
                transition={{
                  duration: 0.9,
                  times: [0, 0.5, 0.82, 1],
                  ease: [0.26, 0.86, 0.44, 1],
                  delay: 0.05,
                }}
              >
                <Image
                  src="/images/site-icon.svg"
                  alt="Site icon"
                  width={40}
                  height={40}
                  className="h-9 w-9 md:h-10 md:w-10 object-contain"
                  priority
                />
              </motion.div>

              <span
                className={`font-semibold text-2xl text-(--fg) transition-all duration-300 ${
                  showInput
                    ? "opacity-0 translate-y-1 md:opacity-100 md:translate-y-0"
                    : "opacity-100 translate-y-0"
                }`}
              >
                Kunal Bhat
              </span>
            </motion.div>

            <nav className="flex flex-wrap items-center gap-2 text-sm font-medium">
              <Link
                href="/"
                className="px-3 py-1.5 rounded-full border border-(--border) bg-transparent text-(--fg) hover:border-(--fg) transition-colors"
              >
                Work
              </Link>
              <Link
                href="/about"
                className="px-3 py-1.5 rounded-full border border-(--border) bg-transparent text-(--fg) hover:border-(--fg) transition-colors"
              >
                About
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4.5">
            <div className="flex items-center gap-2">
              <motion.button
                type="button"
                onClick={revealInput}
                disabled={unlocked}
                className="h-11 w-11 rounded-full grid place-items-center transition-opacity cursor-pointer disabled:cursor-default"
                aria-label={
                  unlocked ? "Portfolio unlocked" : "Enter portfolio password"
                }
                whileHover={!unlocked ? { scale: 1.1 } : undefined}
                whileTap={!unlocked ? { scale: 0.97 } : undefined}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: iconShouldShift ? -10 : 0,
                }}
                transition={{ type: "spring", stiffness: 320, damping: 18 }}
              >
                <Image
                  src={
                    unlocked
                      ? "/images/icon-unlock.svg"
                      : "/images/icon-lock.svg"
                  }
                  alt={unlocked ? "Unlocked" : "Locked"}
                  width={32}
                  height={32}
                  className="h-8 w-8 lock-icon"
                  priority
                />
              </motion.button>

              <AnimatePresence initial={false}>
                {!unlocked && showInput ? (
                  <motion.form
                    key="password-form"
                    ref={formRef}
                    onSubmit={handleSubmit}
                    onBlur={handleBlur}
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "14.5rem" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.4, ease: [0.25, 0.8, 0.35, 1] }}
                    className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm bg-(--input-bg) backdrop-blur overflow-hidden"
                  >
                    <input
                      ref={inputRef}
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
                  </motion.form>
                ) : null}
              </AnimatePresence>
            </div>

            <motion.div
              className={`transform-gpu transition-all duration-400 ease-[cubic-bezier(0.25,0.8,0.35,1)] ${
                showInput
                  ? "translate-x-full opacity-0 md:translate-x-0 md:opacity-100"
                  : "translate-x-0 opacity-100"
              }`}
              initial={false}
              animate={{}}
            >
              <ThemeToggle />
            </motion.div>
          </div>
        </div>
        {error && !unlocked ? (
          <p className="text-sm text-red-500 pt-1">
            Wrong password. Try again.
          </p>
        ) : null}
      </div>
    </motion.header>
  );
}
