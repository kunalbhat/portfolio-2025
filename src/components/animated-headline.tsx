"use client";

import { motion } from "framer-motion";

type AnimatedHeadlineProps = {
  text: string;
  className?: string;
  highlightedWords?: Record<string, string>;
};

export default function AnimatedHeadline({
  text,
  className = "",
  highlightedWords = {},
}: AnimatedHeadlineProps) {
  const words = text.trim().split(/\s+/);
  const baseDelay = 0.085;
  const duration = 0.95;

  return (
    <h1 className={className}>
      {words.map((word, index) => {
        const cleanWord = word.replace(/[^\w-]/g, "");
        const tooltipText = highlightedWords[cleanWord];
        const content = tooltipText ? (
          <span
            className="tooltip-trigger"
            data-tooltip={tooltipText}
            tabIndex={0}
          >
            {word}
          </span>
        ) : (
          word
        );

        return (
          <motion.span
            key={`${word}-${index}`}
            className="inline-block"
            initial={{ y: 16, opacity: 0.001, scale: 0.995 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{
              duration,
              delay: baseDelay * index,
              ease: [0.18, 0.9, 0.28, 1],
            }}
          >
            {content}
            {index < words.length - 1 ? "\u00A0" : ""}
          </motion.span>
        );
      })}
    </h1>
  );
}
