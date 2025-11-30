"use client";

import Image from "next/image";
import SiteHeader from "@/components/site-header";
import WorkDetailLayout from "@/components/work-detail-layout";

export default function DailyDispatchPage() {
  return (
    <div className="max-w-4xl px-6 md:px-16 pt-20 md:pt-28 mx-auto transition-colors duration-650 ease-[cubic-bezier(0.25,0.8,0.35,1)]">
      <SiteHeader />
      <main className="py-10 md:py-14 min-h-screen">
        <WorkDetailLayout
          title="Over-Engineered - “Daily Dispatch”"
          tags={["Concept", "Product Thinking", "Workflow"]}
        >
          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold">Context</h2>
            <p>
              I have a workflow problem that I deal with on a daily basis. And
              as with most things, I&apos;m wondering if I can over-engineer a
              solution to my problem.
            </p>
            <p>Every morning, I open my phone and tackle my daily games:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                First, I open up the NYT Games app to complete Wordle,
                Connections, and the Mini Crossword.
              </li>
              <li>
                Then, I leave the app and head to the browser to complete the
                NYT&apos;s new beta word puzzle game, Strands.
              </li>
              <li>After that, it&apos;s on to a separate app, Coffee Golf.</li>
            </ul>
            <p>*Phew*.</p>
            <p>
              👉🏼 P.S. If you haven&apos;t seen my first article where I reverse
              engineer one of my favorite word puzzle games, check it out!
              Reverse Engineering - Connections by NYT
            </p>
            <p>Now, here&apos;s where the workflow problem comes in.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold">
              Problem statement
            </h2>
            <p className="font-semibold italic">
              As a fan of games that I play with many friends, how can I make
              the repetitive process of sharing my scores a bit easier?
            </p>
            <p>
              If we rewind a little bit, I want to share my scores after
              completing each of these games with different subsets of friends
              and family via messages and WhatsApp.
            </p>
            <p>
              Each game has a sharing mechanism that lets me send off an
              emoji-based message via whatever app I use for messaging.
            </p>
            <p>Sharing scores</p>
            <p>Apple Messages thread</p>
            <p>WhatsApp group</p>
            <p>A quick aside</p>
            <p>
              This sharing mechanism (that I suppose Wordle popularized – check
              me on that) is actually an ingenious visual framework for
              socializing scores. It&apos;s fun, lightweight, and viral.
            </p>
            <p>
              As you saw in the screenshots above, each game utilize this
              mechanism in different and clever ways:
            </p>
            <pre className="whitespace-pre-wrap text-sm md:text-base bg-(--bg-overlay) p-3 rounded-2xl border border-(--border)">
              {`Wordle 1,200 4/6
⬛️ ⬛️ ⬛️ ⬛️ ⬛️
⬛️ ⬛️ ⬛️ 🟩 🟨
🟩 ⬛️ ⬛️ 🟩 ⬛️
🟩 🟩 🟩 🟩 🟩`}
            </pre>
            <pre className="whitespace-pre-wrap text-sm md:text-base bg-(--bg-overlay) p-3 rounded-2xl border border-(--border)">
              {`Connections
Puzzle #342
🟨 🟨 🟨 🟨 
🟦 🟪 🟦 🟦 
🟦 🟦 🟪 🟦 
🟦 🟦 🟦 🟦 
🟩 🟩 🟩 🟩
🟪 🟪 🟪 🟪`}
            </pre>
            <pre className="whitespace-pre-wrap text-sm md:text-base bg-(--bg-overlay) p-3 rounded-2xl border border-(--border)">
              {`Strands #76
”Parts of the equation”
🟡 🔵 🔵 🔵
🔵 🔵`}
            </pre>
            <pre className="whitespace-pre-wrap text-sm md:text-base bg-(--bg-overlay) p-3 rounded-2xl border border-(--border)">
              {`Coffee Golf - May 18
8 Strokes - Top 1% 🏆

🟨 🟦 🟩 🟥 🟪
1️⃣ 2️⃣ 2️⃣ 1️⃣ 2️⃣`}
            </pre>
            <p>
              Now, let&apos;s get back to the reason I need to solve this
              problem.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold">
              Why solve this problem?
            </h2>
            <p>
              I&apos;ve identified a repetitive task that detracts from the
              meaningful activities that bring me delight each day. Let&apos;s
              talk about the operational burden this problem is contributing to:
            </p>
            <figure>
              <Image
                src="/images/daily-dispatch-10.jpg"
                alt="Daily dispatch workflow diagram"
                width={1200}
                height={800}
                className="w-full h-auto rounded-3xl border border-(--border) bg-(--bg-overlay)"
                priority
              />
              <figcaption className="text-sm text-(--muted) mt-2">
                Daily dispatch workflow diagram
              </figcaption>
            </figure>
            <p>
              Using the modeling above with a sample of my workflow, let&apos;s
              assume I&apos;m spending 30 seconds per day sharing out these
              scores. That&apos;s somewhat acceptable, if not inconvenient.
            </p>
            <p>
              However… I&apos;m only currently sharing my Wordle score with 3
              groups, Connections result with 2 groups, and Coffee Golf with 1
              group.
            </p>
            <p>
              Imagine the chaos if Groups B and C take an interest in Coffee
              Golf.
            </p>
            <h3 className="text-xl md:text-2xl font-semibold">
              Other considerations
            </h3>
            <ul className="list-disc list-inside space-y-2">
              <li>
                Deliverability Reliability: Sometimes I complete my games quite
                early in the morning and don&apos;t want to send the scores
                right away. But, I can forget to send them later, so it&apos;d
                be great if I had a backup that sends them at some point in the
                day if I haven&apos;t.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold">
              Possible solution
            </h2>
            <p>
              In my ideal scenario, I could complete each game, share the score
              once and then have the scores sent out to the relevant groups.
            </p>
            <p>
              Comparing these two scenarios, you can see how an intermediary
              could help. Now, there are less lines that take 5 seconds.
              I&apos;m looking at a 50% reduction of effort or a 100% gain in
              efficiency [see appendix for fun], depending on how your product
              marketing department wants to spin it.
            </p>
            <h3 className="text-xl md:text-2xl font-semibold">
              Considerations
            </h3>
            <p>
              Let&apos;s consider the above approach. It generally accomplishes
              what I want but immediately sends scores. This is fine and
              effectively works as it does today… but the workflow can be
              faster.
            </p>
            <h4 className="text-lg md:text-xl font-semibold">Batching</h4>
            <p>
              I don&apos;t necessarily need to share my score as soon as I
              complete the game. In fact, it might be nice to only send the
              scores once all my games are complete and the respective scores
              are in.
            </p>
            <h4 className="text-lg md:text-xl font-semibold">Scheduling</h4>
            <p>
              Related to the above, I might also not want the scores to send
              immediately after all scores are in. It might be nice to send them
              at a scheduled time, like around lunchtime.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold">
              Product requirements
            </h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>
                I want to share my scores once, which magically sends those to
                WhatsApp or iMessage group chats.
              </li>
              <li>
                But, I want those messages to be sent when I want them to be
                sent, effectively enabling the discretion I have when I send
                them manually.
              </li>
              <li>
                And lastly, I need some way to manage who should get what
                messages and when.
              </li>
            </ol>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold">
              Implementation sketch
            </h2>
            <p>
              My app hinges on routing messages to multiple channels with
              protocols like SMS, MMS, and WhatsApp&apos;s custom XMPP. Luckily,
              a service like Twilio has APIs that can handle this for me. To
              utilize those APIs, here&apos;s what I think I would need to
              build:
            </p>
            <h4 className="text-lg md:text-xl font-semibold">Considerations</h4>
            <ul className="list-disc list-inside space-y-2">
              <li>
                This is a low volume application, it&apos;s just for one user
                (for now)
              </li>
              <li>
                I&apos;ll need to store scores and then send them when I want
              </li>
              <li>
                I&apos;ll need a UI to determine when to do the above mentioned
                thing
                <ul className="list-disc list-inside pl-4 space-y-1">
                  <li>
                    I&apos;ll need to put this app behind some simple
                    authentication so its not publicly available
                  </li>
                </ul>
              </li>
            </ul>
            <h4 className="text-lg md:text-xl font-semibold">
              Drawbacks of this approach
            </h4>
            <ul className="list-disc list-inside space-y-2">
              <li>
                My understanding with something like Twilio is that I&apos;ll be
                taking on a new phone number. This disrupts my established
                messaging threads and is slightly disruptive unless I can spin
                the benefit to my external customers (friends and family).
              </li>
            </ul>
            <h4 className="text-lg md:text-xl font-semibold">Tech stack</h4>
            <ul className="list-disc list-inside space-y-2">
              <li>
                React, with a framework like Next.js to make it full-stack
              </li>
              <li>Twilio&apos;s Conversations* API</li>
              <li>BullMQ for job queuing</li>
              <li>Redis** for my database</li>
              <li>Render or Vercel or Google Cloud***, for hosting</li>
            </ul>
            <p>
              🤔 * I&apos;m not sure which of Twilio&apos;s APIs would be best
              here, but after some quick scanning, this seems like the place to
              start. Further diving in required.
            </p>
            <p>
              ** Redis with BullMQ seems like a reasonable choice to include
              after a quick read of this article:
              https://medium.com/@asanka_l/integrating-bullmq-with-nextjs-typescript-f41cca347ef8
            </p>
            <p>
              *** I&apos;ve used all of these hosts for different apps, but
              can&apos;t articulate off the top of my head the trade-offs
              between the services. I would have to dig into this more as well.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold">
              Admin workflow
            </h2>
            <p>
              Before I share scores, I need to use my new app to configure some
              rules:
            </p>
            <ol className="list-decimal list-inside space-y-2">
              <li>
                Scores*: An expectation of what scores it should be looking for
              </li>
              <li>
                Scheduling: A time for when it should send scores when all of
                them are in
                <ul className="list-disc list-inside pl-4 space-y-1">
                  <li>
                    A threshold for when to send messages even if all my scores
                    aren&apos;t in
                  </li>
                </ul>
              </li>
              <li>
                Contacts: I need to define who gets what and when, that needs to
                be stored somewhere
              </li>
            </ol>
            <p>
              💡 * I need some way to know which scores are for what game so I
              can display them in the UI. That&apos;s pretty easy because each
              message has the name of the game in it. I can write some logic to
              infer the game of origin and then use that data for displaying
              everything appropriately in the UI (you&apos;ll see in the
              prototype).
            </p>
            <p>
              OR, I can create and train my own Large Language Model #LLM to
              handle this for me and automatically recognize new games in the
              future. Just kidding. I think.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold">
              Sharing workflow
            </h2>
            <p>
              In the &apos;golden path&apos; of this workflow, I send my scores
              and the app automatically blasts the text out to my friends and
              family.
            </p>
            <ol className="list-decimal list-inside space-y-2">
              <li>
                I complete my games as usual and share my scores, but this time
                I only share once
              </li>
              <li>
                My web app will catch incoming messages from Twilio and store
                them in my database. Based on the rules I set up in the admin,
                it will:
                <ul className="list-disc list-inside pl-4 space-y-1">
                  <li>Display if scores were received and sent</li>
                  <li>
                    Provide me with overrides in case I want to interrupt the
                    automatic workflow
                  </li>
                  <li>
                    Follow some rules to send out my scores if I don&apos;t
                    override anything
                  </li>
                </ul>
              </li>
            </ol>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold">
              System diagram
            </h2>
            <p>
              Please keep in mind that while I am fairly technical, I have not
              spent a lot of actual time drawing up system architecture 😂. But,
              I think it&apos;s important to at least have a little
              understanding of the components of modern app architecture, so
              I&apos;m visualizing something hopefully more than a little
              hand-wavy. Given all that, building this app could look something
              like this:
            </p>
            <p>Untitled</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold">
              Prototype preview (WIP)
            </h2>
            <p>(Coming soon.)</p>
          </section>
        </WorkDetailLayout>
      </main>
    </div>
  );
}
