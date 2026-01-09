"use client";

import Image from "next/image";
import SiteHeader from "@/components/site-header";
import WorkDetailLayout from "@/components/work-detail-layout";

export default function NutritionCoachPage() {
  return (
    <div className="max-w-4xl px-6 md:px-16 pt-20 md:pt-28 mx-auto transition-colors duration-650 ease-[cubic-bezier(0.25,0.8,0.35,1)]">
      <SiteHeader />
      <main className="py-10 md:py-14 min-h-screen">
        <WorkDetailLayout
          title="A1C Guidance with ChatGPT"
          summary="Using ChatGPT as a nutrition coach to understand glycemic impact and build a repeatable food-logging system."
        >
          <figure className="w-[calc(100vw-4rem)] relative left-1/2 right-1/2 -ml-[calc(50vw-2rem)] -mr-[calc(50vw-2rem)] my-10 md:my-12 rounded-3xl bg-(--bg-overlay) shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
            <Image
              src="/images/a1c-screens.jpg"
              alt="A1C project cover screens"
              width={2000}
              height={1200}
              className="w-full h-auto rounded-2xl shadow-[0_14px_36px_rgba(15,23,42,0.16)]"
              priority
            />
          </figure>

          <section className="space-y-3">
            <h2 className="text-xl md:text-2xl font-semibold">Context</h2>
            <p className="text-lg md:text-xl text-(--muted)">
              I used ChatGPT as a nutrition coach to help me better understand
              the glycemic impact of my meals with a goal of lowering my A1C.
              A1C measures average blood sugar over roughly three months.{" "}
              <a
                href="https://www.cdc.gov/diabetes/diabetes-testing/prediabetes-a1c-test.html"
                target="_blank"
                rel="noreferrer"
              >
                A1C overview
              </a>
              .
            </p>
          </section>

          <section className="grid gap-6 md:grid-cols-3 rounded-2xl border border-(--border) bg-(--bg-overlay) p-6 md:p-8">
            <div className="space-y-1">
              <p className="text-sm uppercase tracking-[0.2em] text-(--muted)">
                Role
              </p>
              <p className="text-lg md:text-xl font-semibold">
                Product Designer + Builder
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm uppercase tracking-[0.2em] text-(--muted)">
                Company
              </p>
              <p className="text-lg md:text-xl font-semibold">
                Personal Project
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm uppercase tracking-[0.2em] text-(--muted)">
                Timeline
              </p>
              <p className="text-lg md:text-xl font-semibold">
                July 1 &ndash; August 31 (2 months)
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold">Impact</h2>
            <p className="text-lg md:text-xl text-(--muted)">
              I didn&apos;t have complicated target metrics to hit—just a
              curiosity around building a tool to spur meaningful behavioral
              change. Two months later, as of the end of August, I had
              measurable impact.
            </p>
            <div className="grid gap-8 md:grid-cols-3 py-4 md:py-6">
              <div className="space-y-2 text-center rounded-2xl px-5 py-6 bg-[#F2F3F6]">
                <p className="text-3xl md:text-4xl font-semibold tracking-tight text-(--fg)">
                  -12 lbs
                </p>
                <p className="text-lg md:text-xl text-(--muted)">
                  Weight reduction
                </p>
              </div>
              <div className="space-y-2 text-center rounded-2xl px-5 py-6 bg-[#E7E9EE]">
                <p className="text-3xl md:text-4xl font-semibold tracking-tight text-(--fg)">
                  -10 bpm
                </p>
                <p className="text-lg md:text-xl text-(--muted)">
                  Avg resting heart rate reduction
                </p>
              </div>
              <div className="space-y-2 text-center rounded-2xl px-5 py-6 bg-[#EFF1F4]">
                <p className="text-3xl md:text-4xl font-semibold tracking-tight text-(--fg)">
                  3.4%
                </p>
                <p className="text-lg md:text-xl text-(--muted)">
                  A1C reduction (5.8 → 5.6)
                </p>
              </div>
            </div>
            <p className="text-lg md:text-xl text-(--muted)">
              Layered on top of this was more commitment to cardio exercise, of
              which I now average 150 minutes of high intensity cardio per week.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl md:text-2xl font-semibold">Problem</h2>
            <p className="text-lg md:text-xl text-(--muted)">
              As I became more interested in how my lifestyle affects long-term
              wellbeing, my doctors offered broad preventative guidance to keep
              key health markers like A1C in range—nutrition tips, weekly
              activity goals, and a long list of small lifestyle tweaks.
            </p>
            <p className="text-lg md:text-xl text-(--muted)">
              It felt unclear how those small daily changes would add up, and
              difficult to commit when the feedback loop could take months.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl md:text-2xl font-semibold">Solution</h2>
            <p className="text-lg md:text-xl text-(--muted)">
              I became curious how ChatGPT could help provide more context on
              metabolic health and glucose stability.
            </p>
            <p className="text-lg md:text-xl text-(--muted)">
              What began as conversational exploration and ad-hoc food
              journaling eventually turned into a{" "}
              <strong>repeatable system</strong>. The conversations became less
              exploratory as I started to understand how eating differently fit
              into my day-to-day, and I transitioned the chat into a full-blown
              project.
            </p>
            <p className="text-lg md:text-xl text-(--muted)">
              The project focused on a structured approach to logging daily
              nutrition and getting real-time feedback to track glycemic impact
              and macros.
            </p>
            <figure className="w-[calc(100vw-4rem)] relative left-1/2 right-1/2 -ml-[calc(50vw-2rem)] -mr-[calc(50vw-2rem)] my-8 md:my-10 rounded-2xl bg-(--bg-overlay) shadow-[0_16px_40px_rgba(15,23,42,0.16)]">
              <Image
                src="/images/a1c-chat-gpt.jpg"
                alt="ChatGPT nutrition logging conversation"
                width={1600}
                height={1200}
                className="w-full h-auto rounded-xl shadow-[0_12px_30px_rgba(15,23,42,0.16)]"
              />
            </figure>
            <div className="rounded-2xl bg-(--bg-overlay) px-6 py-6 md:px-8 md:py-8">
              <h3 className="text-xl md:text-2xl font-semibold">
                Agent instructions
              </h3>
              <p className="text-lg md:text-xl text-(--muted) mt-3">
                To make the workflow consistent, I trained the agent with a
                clear prompt and formatting rules so every log looked the same
                and every insight was actionable.
              </p>
              <ul className="list-disc list-inside space-y-2 text-lg md:text-xl text-(--muted) mt-4">
                <li>
                  Ask for missing context (time, location, ingredients, and
                  portions) when a log is incomplete.
                </li>
                <li>
                  Return a structured log: timestamp, meal name, ingredients,
                  estimated macros, and glycemic impact score.
                </li>
                <li>
                  Flag high-sugar or high-GI items and suggest one substitution
                  that keeps the meal similar.
                </li>
                <li>
                  Keep feedback concise and focus on trends over single meals.
                </li>
                <li>
                  Use consistent emoji coding for breakfast, lunch, dinner, and
                  snacks.
                </li>
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl md:text-2xl font-semibold">Usage</h2>
            <p className="text-lg md:text-xl text-(--muted)">
              I asked ChatGPT for some stats to help break down how I&apos;ve
              been using the project since its inception:
            </p>
            <div className="grid gap-8 md:grid-cols-3 py-4 md:py-6">
              <div className="space-y-3 text-center rounded-2xl px-5 py-6 bg-[#F2F3F6]">
                <p className="text-xl md:text-2xl font-semibold text-(--fg)">
                  Exploratory phase
                </p>
                <p className="text-lg md:text-xl text-(--muted)">~30–35%</p>
                <p className="text-lg md:text-xl text-(--muted)">
                  Early July: I experimented with what to track (meals, snacks,
                  alcohol, workouts) and how to track it (emojis, macros,
                  glycemic impact).
                </p>
              </div>
              <div className="space-y-3 text-center rounded-2xl px-5 py-6 bg-[#E7E9EE]">
                <p className="text-xl md:text-2xl font-semibold text-(--fg)">
                  Pure logging
                </p>
                <p className="text-lg md:text-xl text-(--muted)">~40–45%</p>
                <p className="text-lg md:text-xl text-(--muted)">
                  Once the rhythm set in, the bulk of the conversations became
                  short food journal entries like “Log Cobb salad – 7:15pm.”
                </p>
              </div>
              <div className="space-y-3 text-center rounded-2xl px-5 py-6 bg-[#EFF1F4]">
                <p className="text-xl md:text-2xl font-semibold text-(--fg)">
                  System refinement &amp; prototyping
                </p>
                <p className="text-lg md:text-xl text-(--muted)">~20–25%</p>
                <p className="text-lg md:text-xl text-(--muted)">
                  Mid- to late July onward, I started prototyping UI in React
                  that could interface with ChatGPT, adding emoji coding,
                  relative timestamps, and API flows.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl md:text-2xl font-semibold">
              What&apos;s Next
            </h2>
            <p className="text-lg md:text-xl text-(--muted)">
              ChatGPT worked surprisingly well as the primary interface for this
              project, but I started to hit some limitations.
            </p>
            <ul className="list-disc list-inside space-y-2 text-lg md:text-xl text-(--muted)">
              <li>I want a running log of my food journal.</li>
              <li>
                I want quicker shortcuts to log standard entries without typing
                them out every time.
              </li>
              <li>I want running logs of trends and patterns.</li>
              <li>
                ChatGPT got details wrong sometimes (timestamps, time zones, or
                the wrong day).
              </li>
              <li>
                The conversational UI is powerful, but verbose. A dedicated UI
                layer would make interpretation and navigation more robust.
              </li>
            </ul>
            <figure className="w-[calc(100vw-4rem)] relative left-1/2 right-1/2 -ml-[calc(50vw-2rem)] -mr-[calc(50vw-2rem)] rounded-2xl bg-(--bg-overlay) my-8 md:my-10 shadow-[0_18px_50px_rgba(15,23,42,0.16)]">
              <Image
                src="/images/a1c-play-prototype.jpg"
                alt="Play prototype screens for the A1C project"
                width={1400}
                height={1000}
                className="w-full h-auto rounded-xl shadow-[0_14px_36px_rgba(15,23,42,0.16)]"
              />
            </figure>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl md:text-2xl font-semibold">
              Functional prototyping: Figma &rarr; OpenAI API + Play
            </h2>
            <p className="text-lg md:text-xl text-(--muted)">
              I started prototyping a standalone app from three different
              angles:
            </p>
            <ul className="list-disc list-inside space-y-2 text-lg md:text-xl text-(--muted)">
              <li>Figma: Quickly mocking up user flows and light UI.</li>
              <li>OpenAI API: Experimenting with the OpenAI API.</li>
              <li>
                Play: Exploring Play&apos;s iOS prototyping and API tooling.
              </li>
            </ul>
            <p className="text-lg md:text-xl text-(--muted)">
              These approaches overlap slightly, but they helped inform my POV
              to define a more useful tool for me. I also used ChatGPT to inform
              my experimentation in each of these tools:
            </p>
            <ul className="list-disc list-inside space-y-2 text-lg md:text-xl text-(--muted)">
              <li>
                React: ChatGPT helped me scaffold a React app to interact with
                the OpenAI API.
              </li>
              <li>
                Figma: I polled ChatGPT to understand key use cases and
                workflows.
              </li>
              <li>
                Play: I used ChatGPT to help summarize documentation and
                functionality.
              </li>
            </ul>
          </section>
        </WorkDetailLayout>
      </main>
    </div>
  );
}
