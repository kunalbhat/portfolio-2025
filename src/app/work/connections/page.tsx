"use client";

import Image from "next/image";
import SiteHeader from "@/components/site-header";
import WorkDetailLayout from "@/components/work-detail-layout";

export default function ConnectionsCaseStudyPage() {
  return (
    <div className="max-w-4xl px-6 md:px-16 pt-20 md:pt-28 mx-auto transition-colors duration-650 ease-[cubic-bezier(0.25,0.8,0.35,1)]">
      <SiteHeader />
      <main className="py-10 md:py-14 min-h-screen">
        <WorkDetailLayout
          title="Reverse Engineering - Connections by NYT"
          tags={["Product thinking", "Game", "Case study"]}
        >
          <p className="bg-(--bg-overlay) border border-(--border) rounded-2xl p-4 text-sm">
            💡 *Note: I’m not affiliated with the New York Times or the original
            creation of this game. If you’re a fan of daily word games and not
            familiar with Connections, you should check it out!{" "}
            <a
              href="https://www.nytimes.com/games/connections"
              className="underline underline-offset-4"
            >
              https://www.nytimes.com/games/connections
            </a>
            *
          </p>

          <p className="font-semibold">Table of contents</p>

          <h1 className="text-3xl md:text-4xl font-semibold">Context</h1>

          <h2 className="text-2xl md:text-3xl font-semibold">
            About this exercise
          </h2>
          <p>
            If you&apos;re like me, you&apos;re always curious about how things
            work. When using my favorite apps, I often wonder what it would take
            to recreate the logic behind the features I interact with. This
            exercise reveals the complexity behind even the simplest appearing
            apps and offers several benefits, drawing on my diverse background.
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              As a <strong>designer</strong>, I analyze an existing UI,
              identifying the relationships between various elements,
              components, and content.
            </li>
            <li>
              As a <strong>PM</strong>, I break down the app into discrete
              features, articulate the value or purpose of a feature, identify
              dependencies, and define the scope of what I&apos;m going to
              build.
            </li>
            <li>
              As an <strong>engineer</strong>, I contemplate{" "}
              <strong>how</strong> to integrate these elements and actually
              build the product.
            </li>
          </ul>
          <p>
            I thought it would be interesting to demonstrate this process with a
            specific example. So, what am I reverse engineering this time?
            It&apos;s one of my favorite word games by the New York Times -{" "}
            <a
              href="https://www.nytimes.com/games/connections"
              className="underline underline-offset-4"
            >
              Connections
            </a>
            . Let&apos;s dive in!
          </p>

          <h2 className="text-2xl md:text-3xl font-semibold">
            What is Connections?
          </h2>
          <p>Let’s get a clear understanding of what this game is.</p>
          <blockquote className="border-l-4 border-(--border) pl-4">
            <p>
              Connections is a game where your task is to find groups of four
              items that share something in common.
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                Select four items and tap ‘Submit’ to check if your guess i
                correct
              </li>
              <li>Find the groups without making 4 mistakes!</li>
            </ul>
          </blockquote>
          <p>
            Now that we have that context, the next step is to break down the UI
            of this game. To start, there are some primary elements and
            functionality I’m focusing in on.
          </p>

          <h1 className="text-3xl md:text-4xl font-semibold">
            Part 1: Product breakdown
          </h1>

          <h2 className="text-2xl md:text-3xl font-semibold">
            Simple heuristic
          </h2>
          <p>
            A quick evaluation of the existing UI and notes on any observations
            and assumptions I’m making regarding functionality.
          </p>
          <figure className="my-4">
            <Image
              src="/Reverse%20Engineering%20-%20Connections%20by%20NYT/Untitled.png"
              alt="Untitled"
              width={1200}
              height={900}
              className="w-full h-auto rounded-2xl border border-(--border) bg-(--bg-overlay)"
            />
          </figure>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm md:text-base border border-(--border) rounded-2xl overflow-hidden">
              <thead className="bg-(--bg-overlay)">
                <tr>
                  <th className="px-4 py-3 border-b border-(--border)">
                    Element
                  </th>
                  <th className="px-4 py-3 border-b border-(--border)">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--border)">
                <tr>
                  <td className="px-4 py-3">Title</td>
                  <td className="px-4 py-3">Display static string</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Board</td>
                  <td className="px-4 py-3">
                    Display 4 x 4 grid of 16 unique text strings contained in a
                    ‘tile’
                    <br />• Highlight a item when selected
                    <br />• Max 4 items can be highlighted at a time
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Scoring</td>
                  <td className="px-4 py-3">
                    Reflect number of mistakes remaining
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Controls</td>
                  <td className="px-4 py-3">
                    • Shuffle: Randomly redistribute the items in the grid above
                    <br />
                    • Deselect all: remove highlight from any selected tiles
                    <br />
                    • Submit: Submit 4 selected tiles for matching
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Misc notes</td>
                  <td className="px-4 py-3">
                    • Shuffle button is always enabled
                    <br />
                    • Deselect all: enabled once 1 item is selected
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Menu</td>
                  <td className="px-4 py-3">
                    This isn’t core functionality, so I’m going to remove this
                    from scope
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            Here’s the full suite of screens I gathered to further break down
            states and interactions and help define scope.
          </p>
          <h3 className="text-xl md:text-2xl font-semibold">Core screens</h3>
          <figure className="my-4">
            <Image
              src="/Reverse%20Engineering%20-%20Connections%20by%20NYT/Untitled%201.png"
              alt="Selected items"
              width={1200}
              height={900}
              className="w-full h-auto rounded-2xl border border-(--border) bg-(--bg-overlay)"
            />
            <figcaption className="text-sm text-(--muted) mt-1">
              Selected items
            </figcaption>
          </figure>

          <h3 className="text-xl md:text-2xl font-semibold">
            Secondary screens
          </h3>
          {[
            { src: "Untitled%202.png", caption: "Guess accuracy notification" },
            { src: "Untitled%203.png", caption: "Solved group" },
            { src: "Untitled%204.png", caption: "Completed game" },
            { src: "Untitled%205.png", caption: "Welcome screen" },
            { src: "Untitled%206.png", caption: "Instructions sheet" },
            { src: "Untitled%207.png", caption: "Settings sheet" },
            { src: "Untitled%208.png", caption: "Game summary sheet" },
          ].map((item) => (
            <figure key={item.src} className="my-4">
              <Image
                src={`/Reverse%20Engineering%20-%20Connections%20by%20NYT/${item.src}`}
                alt={item.caption}
                width={1200}
                height={900}
                className="w-full h-auto rounded-2xl border border-(--border) bg-(--bg-overlay)"
              />
              <figcaption className="text-sm text-(--muted) mt-1">
                {item.caption}
              </figcaption>
            </figure>
          ))}

          <p>
            I’m seeing a bit more functionality that needs to be accounted for.
            This isn’t exhaustive, but it should be enough to get started on
            building. It looks like I need to display an alert that reports on
            things like how close a guess is to the solution group, or my
            overall ranking on the game based on how many misses I had.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm md:text-base border border-(--border) rounded-2xl overflow-hidden">
              <thead className="bg-(--bg-overlay)">
                <tr>
                  <th className="px-4 py-3 border-b border-(--border)">
                    Element
                  </th>
                  <th className="px-4 py-3 border-b border-(--border)">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--border)">
                <tr>
                  <td className="px-4 py-3">Alert</td>
                  <td className="px-4 py-3">
                    <strong>Display guess feedback</strong>
                    <br />
                    • Indicate when a group is “one away” from correct
                    <br />
                    <br />
                    <strong>Display game rating</strong>
                    <br />
                    • Show “Perfect, great, good” etc. depending on how many
                    misses are left after the game is done
                    <br />
                    <br />
                    <strong>Incorrect guesses</strong>
                    <br />
                    • Display an alert “One away...” if the guess contains 3/4
                    correct items in the group
                    <br />
                    • Display “Already guessed” and disallow players from
                    guessing an incorrect group more than once
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Board / Correct group</td>
                  <td className="px-4 py-3">
                    <strong>Display completed rows</strong>
                    <br />
                    • Assign it a color based on difficulty level
                    <br />
                    • Display group title
                    <br />
                    • Display group items
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Scoring</td>
                  <td className="px-4 py-3">
                    Reflect number of mistakes remaining
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Misc notes</td>
                  <td className="px-4 py-3">
                    • Move completed groups to the top of the board
                    <br />
                    • ‘Shake’ animation for board for incorrect guesses
                    <br />
                    • Alert appears for *X* amount of seconds
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="text-2xl md:text-3xl font-semibold">Data model</h2>
          <p>
            Based on the game board, here’s a quick sketch of how a simple
            version of the data could be modeled…
          </p>
          <figure className="my-4">
            <Image
              src="/Reverse%20Engineering%20-%20Connections%20by%20NYT/Untitled%209.png"
              alt="Untitled"
              width={1200}
              height={900}
              className="w-full h-auto rounded-2xl border border-(--border) bg-(--bg-overlay)"
            />
          </figure>
          <pre className="whitespace-pre-wrap text-sm md:text-base bg-(--bg-overlay) p-3 rounded-2xl border border-(--border)">
            {`const gameData = {
    data: {
      1: {
        title: "Power issues",
        difficulty: 1,
        items: ["spike", "surge", "outage", "short"],
      },
      2: {
        title: "Summary",
        difficulty: 2,
        items: ["digest", "brief", "outline", "abstract"],
      },
      3: {
        title: "Trust as real",
        difficulty: 3,
        items: ["accept", "believe", "buy", "swallow"],
      },
      4: {
        title: "Name homophones",
        difficulty: 4,
        items: ["kneel", "wane", "hairy", "curt"],
      },
    },
  };`}
          </pre>
          <p>Some thoughts on the initial sketch:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              There’s a new board each day so the overall object, which I’ve
              called `gameData`, likely has a bunch of other things defined in
              it. One example could be the date of each `data` object.
            </li>
            <li>
              You could name each entry in `data` something more descriptive,
              but I’m keeping it pretty simple right now by just assigning a
              basic numerical value.
            </li>
            <li>
              Related to the above, you could infer `difficulty` from the name
              of each entry, but I like explicitly defining that.
              <ul className="list-disc list-inside pl-4 space-y-1">
                <li>
                  I use the value of `difficulty` to map rating labels (e.g.
                  “Perfect”, “Phew”) in the code; it’s probably cleaner to
                  explicitly define those labels in the data object.
                </li>
              </ul>
            </li>
          </ul>

          <h2 className="text-2xl md:text-3xl font-semibold">Code sketch</h2>
          <p>
            Here’s how I am thinking about the functionality I’m going to need
            to build.
          </p>
          <p className="font-semibold">Display the items of each group</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Store initial group data in an object</li>
            <li>
              Initialize the game by:
              <ul className="list-disc list-inside pl-4 space-y-1">
                <li>Take all the items and store them in an flat array</li>
              </ul>
            </li>
            <li>
              Randomize items and display them in a 4 x 4 grid
              <ul className="list-disc list-inside pl-4 space-y-1">
                <li>Use a randomize function to mixup the array</li>
              </ul>
            </li>
            <li>
              Iterate through the array and display the item in a UI element (4
              x 4 grid)
            </li>
          </ul>

          <p className="font-semibold">Matching</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              When 4 items are selected, determine if they match any of the
              items arrays in the original object
            </li>
            <li>
              If they match, display the solved group as a new row at the top of
              the grid
              <ul className="list-disc list-inside pl-4 space-y-1">
                <li>Removes solved group items from board</li>
              </ul>
            </li>
            <li>When all 4 groups are solved, the game is won</li>
          </ul>

          <p className="font-semibold">Scoring</p>
          <ul className="list-disc list-inside space-y-1">
            <li>If all 4 tries are used, the game is over (you’ve lost!)</li>
            <li>
              A game rating (Perfect, great, good, phew) is assigned based on
              how many unused tries are left
            </li>
          </ul>

          <h1 className="text-3xl md:text-4xl font-semibold">
            Part 2: Product definition
          </h1>
          <p>
            Let’s quickly define what’s in scope and what’s not for this
            exercise.
          </p>

          <h3 className="text-xl md:text-2xl font-semibold">In scope</h3>
          <p>
            I’m going to focus on building the core screens and functionality:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Game board</li>
            <ul className="list-disc list-inside pl-4 space-y-1">
              <li>Displaying items</li>
              <li>Matching correct guesses</li>
              <li>Updating the UI to reflect current state</li>
              <li>Limiting max 4 items of selection</li>
            </ul>
            <li>Alerts</li>
            <ul className="list-disc list-inside pl-4 space-y-1">
              <li>Display alerts for ~~guess accuracy and~~ game state</li>
            </ul>
            <li>Controls</li>
            <ul className="list-disc list-inside pl-4 space-y-1">
              <li>Shuffle</li>
            </ul>
            <ul className="list-disc list-inside pl-4 space-y-1">
              <li>Deselect all</li>
              <li>Submit guesses</li>
            </ul>
          </ul>

          <h3 className="text-xl md:text-2xl font-semibold">Out of scope</h3>
          <p>
            I&apos;m going to eliminate the following screens with static
            content that are less interesting to build:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>❌ Welcome screen</li>
            <li>❌ Instructions sheet</li>
            <li>❌ Game summary sheet</li>
          </ul>
          <p>A few notes on what I&apos;m leaving out:</p>
          <p className="font-semibold">Animations</p>
          <p>
            There are some nice animated UI cues that could probably easily be
            accomplished by something like the React Spring library
            https://www.react-spring.dev/docs but I&apos;m going to leave those
            out for now just to focus on the core functionality.
          </p>
          <p className="font-semibold">Guess accuracy</p>
          <p>
            I won&apos;t get to this but I&apos;ll add this to the list of
            fast-follows if I do a part 2 of clean-up
          </p>
          <p className="font-semibold">Share sheet</p>
          <p>
            Even though it&apos;s out of scope, the game summary actually has a
            lot of interesting things going on.
          </p>
          <p>
            The visual map is great for sharing scores. I don&apos;t intend to
            store local data or track guesses in app state, but if I did, I
            could record each guess, its proximity to the solution group, and
            represent that guess history using abstract shapes and colors.
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              Identify how close incorrect guesses were to a solution group
            </li>
            <li>Identify from which group the incorrect guesses came</li>
            <li>Track of the order of guesses</li>
          </ul>

          <h1 className="text-3xl md:text-4xl font-semibold">
            Part 3: Building
          </h1>
          <p>
            Now I&apos;ll describe my approach to building this application.
          </p>
          <p className="bg-(--bg-overlay) border border-(--border) rounded-2xl p-4 text-sm">
            💡 A lot of this code is a first-pass and certainly not for
            production. I&apos;ll note under each block of code where I think
            there is room to optimize or just do something differently from how
            I approached this from scratch.
          </p>

          <h3 className="text-xl md:text-2xl font-semibold">Data object</h3>
          <p>
            <a href="https://github.com/kunalbhat/connections-clone/blob/80c4486c036f18de661f159c58155995e03dc018/app/page.js#L10-L33">
              https://github.com/kunalbhat/connections-clone/blob/80c4486c036f18de661f159c58155995e03dc018/app/page.js#L10-L33
            </a>
          </p>

          <h3 className="text-xl md:text-2xl font-semibold">
            Manipulate original data
          </h3>
          <p>
            I want to reference the original data, but flatten it for the
            purposes of displaying in the game board.
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              I&apos;m iterating through the original data object, grabbing the
              `items` from each entry and pushing them into a temporary array.
            </li>
            <li>
              I&apos;m also checking each time if any of the groups have been
              solved and only displaying the items from the groups left to
              solve. I&apos;ll explain why I&apos;m doing that a little later.
            </li>
            <li>
              Once I obtain a flat array of all the items I intend to display, I
              mix them up.
            </li>
            <li>
              I&apos;ll use this function to both initialize the game board and
              shuffle it on demand using the shuffle button.
            </li>
          </ul>
          <p>
            <a href="https://github.com/kunalbhat/connections-clone/blob/80c4486c036f18de661f159c58155995e03dc018/app/page.js#L45-L62">
              https://github.com/kunalbhat/connections-clone/blob/80c4486c036f18de661f159c58155995e03dc018/app/page.js#L45-L62
            </a>
          </p>

          <h3 className="text-xl md:text-2xl font-semibold">
            Compare items to solution groups
          </h3>
          <p>
            Now I need to determine whether a set of items matches a solution
            group and if not, how far off it is.
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              I&apos;m collecting the selected items items, iterating through
              the correct groups and seeing if there are any matches
            </li>
            <li>
              I&apos;m sorting both arrays so they are ordered alphabetically
              and easier to compare
            </li>
          </ul>
          <p>
            <a href="https://github.com/kunalbhat/connections-clone/blob/80c4486c036f18de661f159c58155995e03dc018/app/page.js#L64-L88">
              https://github.com/kunalbhat/connections-clone/blob/80c4486c036f18de661f159c58155995e03dc018/app/page.js#L64-L88
            </a>
          </p>
          <p>
            These are the parts doing the most work, but there&apos;s obviously
            a bit more going on, so I invite you to check out the Github repo
            (specifically page.js) to see the full code!
          </p>

          <h1 className="text-3xl md:text-4xl font-semibold">
            Live code sketch
          </h1>
          <p>
            It was really easy to deploy the code to Vercel, the Github
            integration makes it seamless!
          </p>
          <p>Check it out live, hosted on Vercel:</p>
          <p>
            <a href="https://connections-clone-eight.vercel.app/">
              https://connections-clone-eight.vercel.app/
            </a>
          </p>

          <h1 className="text-3xl md:text-4xl font-semibold">Conclusion</h1>
          <p>
            It actually took me longer to create this write-up than it did to
            build the app 😂 but I really enjoyed documenting my process. Notion
            also made it really easy to embed Github code, use a little AI (not
            too much though!) to clean up some of my writing, and embed the
            final product. I&apos;ll definitely do this again sometime!
          </p>
        </WorkDetailLayout>
      </main>
    </div>
  );
}
