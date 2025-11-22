"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
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
  const inputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

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

  return (
    <motion.header className="fixed inset-x-0 top-0 z-30">
      <div className="max-w-8xl mx-auto px-6 md:px-16">
        <div className="flex items-center justify-between py-6 md:py-8">
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
              className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-lime-200 flex items-center justify-center shrink-0 overflow-hidden"
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
              className={`font-bold text-2xl text-(--fg) transition-all duration-300 ${
                showInput
                  ? "opacity-0 translate-y-1 md:opacity-100 md:translate-y-0"
                  : "opacity-100 translate-y-0"
              }`}
            >
              Kunal Bhat
            </span>
          </motion.div>

          <div className="flex items-center gap-4.5">
            <AnimatePresence initial={false}>
              {unlocked ? (
                <motion.div
                  key="unlocked"
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.95 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="h-11 w-11 rounded-full bg-(--bg-overlay) grid place-items-center"
                >
                  <Image
                    src="/images/icon-unlock.svg"
                    alt="Unlocked"
                    width={32}
                    height={32}
                    className="h-8 w-8 lock-icon"
                    priority
                  />
                </motion.div>
              ) : showInput ? (
                <motion.form
                  key="password-form"
                  ref={formRef}
                  onSubmit={handleSubmit}
                  onBlur={handleBlur}
                  initial={{ opacity: 0, x: 16, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 12, scale: 0.98 }}
                  transition={{ duration: 0.45, ease: [0.25, 0.8, 0.35, 1] }}
                  className="flex items-center gap-2 bg-(--bg-overlay) rounded-full px-3 py-1.5 text-sm"
                >
                  <Image
                    src="/images/icon-lock.svg"
                    alt="Locked"
                    width={32}
                    height={32}
                    className="h-8 w-8 lock-icon"
                  />
                  <input
                    ref={inputRef}
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Password"
                    className="bg-transparent outline-none placeholder:text-(--muted) text-(--fg) text-lg w-32 md:w-36"
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
              ) : (
                <motion.button
                  key="lock-button"
                  type="button"
                  onClick={revealInput}
                  className="h-11 w-11 rounded-full bg-(--bg-overlay) grid place-items-center transition-opacity cursor-pointer"
                  aria-label="Enter portfolio password"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.97 }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 320, damping: 18 }}
                >
                  <Image
                    src="/images/icon-lock.svg"
                    alt=""
                    width={32}
                    height={32}
                    className="h-8 w-8 lock-icon"
                  />
                </motion.button>
              )}
            </AnimatePresence>

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
