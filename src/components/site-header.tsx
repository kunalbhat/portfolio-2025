"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import ThemeToggle from "@/components/theme-toggle";

export default function SiteHeader() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-30 backdrop-blur-sm"
      style={{
        opacity,
        willChange: "opacity, background-color",
        backgroundColor: "color-mix(in srgb, var(--bg) 85%, transparent)",
        transition: "background-color 0.65s cubic-bezier(0.25, 0.8, 0.35, 1)",
      }}
    >
      <div className="max-w-8xl mx-auto px-8 md:px-16">
        <div className="flex items-center justify-between py-6 md:py-8">
          <motion.div
            className="flex items-center gap-4"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <motion.div
              className="h-12 w-12 rounded-full bg-lime-200 flex items-center justify-center"
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
                width={50}
                height={50}
                priority
              />
            </motion.div>

            <span className="font-bold text-2xl text-(--fg)">Kunal Bhat</span>
          </motion.div>

          <ThemeToggle />
        </div>
      </div>
    </motion.header>
  );
}
