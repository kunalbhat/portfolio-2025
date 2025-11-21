"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

type Theme = "light" | "dark";

function getPreferredTheme(): Theme {
  if (typeof window === "undefined") return "dark";

  const stored = window.localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  // Read initial preference
  useEffect(() => {
    const initial = getPreferredTheme();
    queueMicrotask(() => setTheme(initial));
  }, []);

  // Reflect theme into DOM + localStorage
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem("theme", theme);
    }
  }, [theme]);

  const isDark = theme === "dark";

  const toggle = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const iconTransition = {
    duration: 0.6,
    ease: [0.25, 0.8, 0.35, 1] as [number, number, number, number],
  };

  const sunMotion = {
    initial: { y: 14, opacity: 0, scale: 0.95 },
    animate: { y: 0, opacity: 1, scale: 1 },
    exit: { y: 14, opacity: 0, scale: 0.95 },
    transition: iconTransition,
  };

  const moonMotion = {
    initial: { y: -14, opacity: 0, scale: 0.95 },
    animate: { y: 0, opacity: 1, scale: 1 },
    exit: { y: -14, opacity: 0, scale: 0.95 },
    transition: iconTransition,
  };

  return (
    <motion.button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex h-12 w-12 items-center justify-center rounded-full cursor-pointer"
      whileHover={{ scale: 1.1 }}
      transition={{ type: "spring", stiffness: 320, damping: 18 }}
    >
      <div className="relative h-8 w-8 overflow-hidden">
        <AnimatePresence initial={false} mode="popLayout">
          {isDark ? (
            // 🌙 Moon rises when going to dark mode, sets when leaving
            <motion.div
              key="moon"
              {...moonMotion}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Image
                src="/images/icon-moon.svg"
                alt="Dark mode"
                width={32}
                height={32}
                className="h-8 w-8 invert"
                priority
              />
            </motion.div>
          ) : (
            // ☀️ Sun rises in light mode, sets when going to dark
            <motion.div
              key="sun"
              {...sunMotion}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Image
                src="/images/icon-sun.svg"
                alt="Light mode"
                width={32}
                height={32}
                className="h-8 w-8"
                priority
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
}
