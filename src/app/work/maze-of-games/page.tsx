"use client";

import Image from "next/image";
import SiteHeader from "@/components/site-header";
import WorkDetailLayout from "@/components/work-detail-layout";

export default function MazeOfGamesCaseStudyPage() {
  return (
    <div className="max-w-4xl px-6 md:px-16 pt-20 md:pt-28 mx-auto transition-colors duration-650 ease-[cubic-bezier(0.25,0.8,0.35,1)]">
      <SiteHeader />
      <main className="py-10 md:py-14 min-h-screen">
        <WorkDetailLayout
          title="Maze of Games — Interactive Puzzle Interfaces"
          summary="A browser-based toolkit for exploring puzzles from The Maze of Games without giving away the answers."
        >
          <figure className="mb-8">
            <Image
              src="https://raw.githubusercontent.com/kunalbhat/maze-of-games/master/puzzle_1/screenshots/puzzle_1_interface.png"
              alt="Maze of Games - Puzzle 1 interface"
              width={1400}
              height={1100}
              className="w-full h-auto rounded-2xl border border-(--border) bg-(--bg-overlay)"
              priority
            />
          </figure>

          <section className="space-y-4">
            <p>
              Interfaces for puzzles from <em>The Maze of Games</em>, Mike
              Selinker&apos;s interactive puzzle novel. Like any good puzzle
              hunt, the tools are there to help you tinker, not to solve
              everything for you. They mirror the spirit of the book—explore,
              experiment, and follow the threads.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-xl md:text-2xl font-semibold">Overview</h3>
            <blockquote className="border-l-4 border-(--border) pl-4 text-(--muted)">
              “The Maze of Games is a full-length puzzle novel with over 50
              puzzles and a deeply engaging story, all woven together in a
              ‘solve your own adventure’ style which will keep you jumping from
              page to page.”
            </blockquote>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">Puzzle 1</h3>
            <p>
              The first challenge is a 13×13 letter grid. The top row starts as
              “TURN THE TABLES,” and each column (except the first) can be
              rotated up or down. The goal: align the rotations so the full grid
              reveals a hidden phrase. Building the tool actually took longer
              than solving the puzzle once it was running.
            </p>
            <h4 className="text-lg font-semibold">Using the interface</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Click an arrow to shift its column up or down.</li>
              <li>
                Offsets are shown beneath each column as a visual aid while you
                search for the solution.
              </li>
            </ul>
            <p>
              Clone the repo and tinker locally:{" "}
              <a
                href="https://github.com/kunalbhat/maze-of-games"
                className="underline underline-offset-4"
              >
                github.com/kunalbhat/maze-of-games
              </a>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-xl md:text-2xl font-semibold">Sources</h3>
            <p>
              <a
                href="http://www.lonesharkgames.com/maze/"
                className="underline underline-offset-4"
              >
                Loneshark Games — The Maze of Games
              </a>
            </p>
          </section>
        </WorkDetailLayout>
      </main>
    </div>
  );
}
