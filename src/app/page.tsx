"use client";

import { motion } from "framer-motion";
import ThemeToggle from "@/components/theme-toggle";
import AnimatedHeadline from "@/components/animated-headline";

export default function Home() {
  return (
    <div className="max-w-8xl p-8 md:p-16 mx-auto">
      <header className="flex items-center justify-between pb-6 md:pb-12">
        {/* NAME + LOGO */}
        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          {/* Lime circle + SVG */}
          <motion.div
            className="h-12 w-12 rounded-full bg-lime-200 flex items-center justify-center"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{
              // subtle: grow → tiny settle dip → final
              scale: [0.7, 1.06, 0.98, 1],
              opacity: [0, 1, 1, 1],
            }}
            transition={{
              duration: 0.9,
              times: [0, 0.5, 0.82, 1],
              ease: [0.26, 0.86, 0.44, 1], // smooth, luxe curve
              delay: 0.05, // tiny offset after header fades in
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/site-icon.svg"
              alt="Site icon"
              className="h-10 w-10"
            />
          </motion.div>

          <span className="font-bold text-2xl text-(--fg)">Kunal Bhat</span>
        </motion.div>

        <ThemeToggle />
      </header>

      <main className="py-12 min-h-screen">
        <AnimatedHeadline
          className="mb-12 md:mb-24"
          text="Product designer with 20 years of experience in roles as a designer, PM, and engineer."
        />
        <h2>
          Currently at <a href="#">Aura</a> building experiences that bring
          millions of families closer together.
        </h2>
      </main>
    </div>
  );
}
