"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import ThemeToggle from "@/components/theme-toggle";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function SiteHeader() {
  const [isVisible, setIsVisible] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const { scrollY } = useScroll();
  const pathname = usePathname();
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileToggleRef = useRef<HTMLButtonElement | null>(null);
  const lastScroll = useRef(0);
  const lastHidePosition = useRef(0);
  const [enterFrom, setEnterFrom] = useState(0);

  useMotionValueEvent(scrollY, "change", (value) => {
    const current = value ?? 0;
    setHasScrolled(current > 12);
    const delta = current - lastScroll.current;

    // Always show near the top
    if (current < 20) {
      setIsVisible(true);
      lastHidePosition.current = current;
      lastScroll.current = current;
      return;
    }

    // If scrolling further down while hidden, update the hide anchor
    if (!isVisible && delta > 0) {
      lastHidePosition.current = current;
    }

    // Hide when scrolling down
    if (delta > 0 && isVisible) {
      setEnterFrom(0);
      setIsVisible(false);
      lastHidePosition.current = current;
    }

    // Reveal after 120px of upward travel from the last hide point
    if (delta < 0 && !isVisible) {
      const upDistance = lastHidePosition.current - current;
      if (upDistance >= 120) {
        setEnterFrom(50);
        setIsVisible(true);
      }
    }

    lastScroll.current = current;
  });

  // Close the mobile menu when scrolling down or resizing up.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Dismiss mobile menu when clicking outside
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (
        !target ||
        mobileMenuRef.current?.contains(target) ||
        mobileToggleRef.current?.contains(target)
      ) {
        return;
      }
      setIsMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-30 site-header"
      initial={{ opacity: 1, y: 0, pointerEvents: "auto" }}
      animate={
        isVisible
          ? {
              opacity: 1,
              y: 0,
              pointerEvents: "auto",
              transition: {
                opacity: { duration: 0.35, ease: [0.25, 0.8, 0.35, 1] },
                y: {
                  from: enterFrom,
                  duration: 0.55,
                  ease: [0.25, 0.8, 0.35, 1],
                },
              },
            }
          : {
              opacity: 0,
              y: -12,
              pointerEvents: "none",
              transition: { duration: 0.3, ease: [0.25, 0.8, 0.35, 1] },
            }
      }
    >
      <div className="max-w-8xl mx-auto px-6 md:px-16">
        <div className="flex items-center justify-between my-6 md:my-8">
          <div className="flex items-center gap-6 md:gap-10">
            <Link
              href="/"
              className={`group flex items-center gap-4 rounded-full transform-gpu transition-all duration-400 ease-[cubic-bezier(0.25,0.8,0.35,1)] hover:opacity-90 ${
                hasScrolled
                  ? "pl-3 pr-5 py-2 border border-(--border) bg-[color-mix(in_srgb,var(--bg)70%,transparent)] backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.14)]"
                  : "border border-transparent bg-transparent shadow-none"
              }`}
            >
              <motion.div
                className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-(--accent) flex items-center justify-center shrink-0 overflow-hidden transition-transform duration-300 group-hover:scale-105"
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

              <span className="font-semibold text-2xl text-(--fg) bg-transparent">
                Kunal Bhat
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <nav
              className={`hidden md:flex items-center gap-8 rounded-full transform-gpu transition-all duration-400 ease-[cubic-bezier(0.25,0.8,0.35,1)] ${
                hasScrolled
                  ? "px-5 py-3 border border-(--border) bg-[color-mix(in_srgb,var(--bg)70%,transparent)] backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.14)]"
                  : "border border-transparent bg-transparent shadow-none"
              }`}
              aria-label="Primary"
            >
              <Link
                href="/work"
                className={`text-xl font-semibold text-(--fg) hover:opacity-90 transition-colors px-3 py-1 ${
                  pathname === "/work" || pathname.startsWith("/work/")
                    ? "bg-(--accent)"
                    : "bg-transparent hover:bg-(--bg-overlay)"
                }`}
              >
                Projects
              </Link>
              <Link
                href="/about"
                className={`text-xl font-semibold text-(--fg) hover:opacity-90 transition-colors px-3 py-1 ${
                  pathname === "/about"
                    ? "bg-(--accent)"
                    : "bg-transparent hover:bg-(--bg-overlay)"
                }`}
              >
                About
              </Link>
              <a
                href="https://www.linkedin.com/in/kunal-s-bhat/"
                className="inline-flex items-center gap-2 text-xl font-semibold text-(--fg) bg-transparent hover:bg-(--bg-overlay) hover:opacity-90 transition-colors px-3 py-1 rounded-full group/link"
              >
                LinkedIn
                <Image
                  src="/images/icon-arrow-link.png"
                  alt="External link arrow icon"
                  width={24}
                  height={24}
                  className="h-6 w-6 transition-transform duration-200 group-hover/link:scale-110 invert-on-dark"
                  priority
                />
              </a>
              <div>
                <ThemeToggle />
              </div>
            </nav>

            <button
              type="button"
              ref={mobileToggleRef}
              className={`md:hidden h-12 w-12 rounded-full grid place-items-center transition-all duration-300 ${
                hasScrolled
                  ? "bg-[color-mix(in_srgb,var(--bg)70%,transparent)] border border-(--border) backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.14)]"
                  : "bg-transparent border border-transparent shadow-none"
              }`}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              onClick={() => setIsMenuOpen((open) => !open)}
            >
              <span className="flex flex-col gap-2">
                <span className="block h-0.75 w-5 bg-(--fg) rounded-full" />
                <span className="block h-0.75 w-5 bg-(--fg) rounded-full" />
              </span>
            </button>
          </div>
        </div>
        <motion.nav
          className="md:hidden mt-3 origin-top"
          initial={false}
          animate={{
            height: isMenuOpen ? "auto" : 0,
            opacity: isMenuOpen ? 1 : 0,
            marginTop: isMenuOpen ? 12 : 0,
          }}
          transition={{ duration: 0.3, ease: [0.25, 0.8, 0.35, 1] }}
          aria-label="Mobile navigation"
        >
          {isMenuOpen ? (
            <div
              ref={mobileMenuRef}
              className="flex flex-col gap-3 bg-[color-mix(in_srgb,var(--bg)70%,transparent)] border border-(--border) rounded-2xl px-4 py-4 shadow-[0_18px_60px_rgba(0,0,0,0.14)] backdrop-blur-xl"
            >
              <Link
                href="/work"
                className={`text-lg font-semibold text-(--fg) hover:opacity-90 transition-colors px-3 py-1 ${
                  pathname === "/work" || pathname.startsWith("/work/")
                    ? "bg-(--accent)"
                    : "bg-transparent hover:bg-(--bg-overlay)"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Projects
              </Link>
              <Link
                href="/about"
                className={`text-lg font-semibold text-(--fg) hover:opacity-90 transition-colors px-3 py-1 ${
                  pathname === "/about"
                    ? "bg-(--accent)"
                    : "bg-transparent hover:bg-(--bg-overlay)"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <a
                href="https://www.linkedin.com/in/kunal-s-bhat/"
                className="text-lg font-semibold text-(--fg) bg-transparent hover:bg-(--bg-overlay) hover:opacity-90 transition-colors px-3 py-1 rounded-full"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </a>
              <div className="pt-2 border-t border-(--border)">
                <ThemeToggle />
              </div>
            </div>
          ) : null}
        </motion.nav>
      </div>
    </motion.header>
  );
}
