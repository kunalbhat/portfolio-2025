"use client";

import Image from "next/image";
import SiteHeader from "@/components/site-header";
import WorkDetailLayout from "@/components/work-detail-layout";

export default function SkytellerPage() {
  return (
    <div className="max-w-4xl px-6 md:px-16 pt-20 md:pt-28 mx-auto transition-colors duration-650 ease-[cubic-bezier(0.25,0.8,0.35,1)]">
      <SiteHeader />
      <main className="py-10 md:py-14 min-h-screen">
        <WorkDetailLayout
          title="Skyteller"
          summary="A crypto off-ramp that let people move funds from self-custodial wallets to bank accounts with a single, secure flow."
        >
          <figure className="w-[calc(100vw-4rem)] relative left-1/2 right-1/2 -ml-[calc(50vw-2rem)] -mr-[calc(50vw-2rem)] my-10 md:my-12">
            <Image
              src="/images/skyteller-core-screens.jpg"
              alt="Skyteller core screens"
              width={1600}
              height={1000}
              className="w-full h-auto rounded-3xl shadow-[0_14px_36px_rgba(15,23,42,0.16)]"
              priority
            />
            <figcaption className="mt-4 text-base md:text-lg text-(--muted)">
              Core screens from the Skyteller responsive web app.
            </figcaption>
          </figure>

          <section className="space-y-6">
            <p>
              Skyteller started with a simple promise: turn crypto into cash in
              one click while keeping users in control of their funds. We built
              a bridge from self-custodial wallets to bank accounts that routed
              funds through a personalized on-chain contract and a compliant
              off-ramp partner.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-(--border) bg-(--bg-overlay) p-4 md:p-6 space-y-2">
                <p className="text-sm uppercase tracking-[0.2em] text-(--muted)">
                  Role
                </p>
                <p className="text-lg md:text-xl font-semibold">
                  Engineering + Product Design
                </p>
              </div>
              <div className="rounded-2xl border border-(--border) bg-(--bg-overlay) p-4 md:p-6 space-y-2">
                <p className="text-sm uppercase tracking-[0.2em] text-(--muted)">
                  Company
                </p>
                <p className="text-lg md:text-xl font-semibold">Galactic</p>
              </div>
              <div className="rounded-2xl border border-(--border) bg-(--bg-overlay) p-4 md:p-6 space-y-2">
                <p className="text-sm uppercase tracking-[0.2em] text-(--muted)">
                  Timeline
                </p>
                <p className="text-lg md:text-xl font-semibold">2021–2023</p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">Context</h3>
            <p>
              In 2023, buying crypto was getting easier, but turning it into
              “real” money still came with huge hurdles—both technical and
              experiential. Off-ramping required multiple tools, fees stacked
              quickly, and the UX was brittle. Exchanges could fail, wallets
              could be misused, and every hop added risk. For people earning
              income in crypto, the consequences were real. We wanted to make
              off-ramping simple, secure, and trustworthy. The product shipped
              as a responsive web app so merchants could complete the full flow
              on both desktop and mobile.
            </p>
            <p>
              This was a personal pivot for me: after PM-ing at PayPal, I
              stepped into a primarily engineering role. I focused on our React
              stack and web3 integrations while also designing the core user
              flows and leading the UX/UI direction.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">
              Pivot: card program to off-ramp
            </h3>
            <p>
              We initially explored a debit card program, but it became clear
              that the foundational work needed for a card—identity, risk, and
              reliable funds movement—was the same work required to build a
              world-class off-ramp. We pivoted to the off-ramp first, treating
              it as the core primitive that would later unlock cards, bill pay,
              and other financial tools.
            </p>
            <p>
              The card path also put too much of our roadmap in the hands of
              regulatory mandates tied to issuing through Lithic, which limited
              our control over timing and experience. The off-ramp gave us a
              clearer path to delivering value while we built the right
              compliance foundation.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">
              Problem statement
            </h3>
            <p>
              Converting digital assets into fiat is tedious, risky, and costly.
              The question we anchored on: how might we empower crypto natives
              and the crypto-curious with a straightforward, secure path to
              funds out?
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">Goals</h3>
            <ul>
              <li>
                Enable users to off-ramp quickly with clear, transparent
                transaction status.
              </li>
              <li>
                Deliver the smoothest onboarding experience in a crypto-enabled
                dApp.
              </li>
              <li>
                Build the foundation for future products like bill pay, P2P,
                and cards.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">Impact</h3>
            <p className="text-(--muted)">
              This product was less about traditional metrics and more about
              making something brand new—and truly hard to build—feel possible
              for everyday users. The impact was in proving the concept,
              reducing intimidation, and showing that off-ramping could be
              approachable without sacrificing trust.
            </p>
            <p className="text-(--muted)">
              These integrations represent the bets we made to stitch together
              a credible, end-to-end experience across wallets, identity, and
              money movement.
            </p>
            <div className="grid gap-6 md:grid-cols-3 py-4 md:py-6">
              <div className="space-y-2 text-center rounded-2xl px-5 py-6 bg-[#F2F3F6]">
                <p className="text-xl md:text-2xl font-semibold tracking-tight text-(--fg)">
                  RainbowKit
                </p>
                <p className="text-lg md:text-xl text-(--muted)">
                  Wallet connection UI
                </p>
              </div>
              <div className="space-y-2 text-center rounded-2xl px-5 py-6 bg-[#E7E9EE]">
                <p className="text-xl md:text-2xl font-semibold tracking-tight text-(--fg)">
                  wagmi
                </p>
                <p className="text-lg md:text-xl text-(--muted)">
                  Web3 hooks + providers
                </p>
              </div>
              <div className="space-y-2 text-center rounded-2xl px-5 py-6 bg-[#EFF1F4]">
                <p className="text-xl md:text-2xl font-semibold tracking-tight text-(--fg)">
                  Plaid
                </p>
                <p className="text-lg md:text-xl text-(--muted)">
                  Bank account linking
                </p>
              </div>
              <div className="space-y-2 text-center rounded-2xl px-5 py-6 bg-[#F2F3F6]">
                <p className="text-xl md:text-2xl font-semibold tracking-tight text-(--fg)">
                  Persona
                </p>
                <p className="text-lg md:text-xl text-(--muted)">
                  KYC verification
                </p>
              </div>
              <div className="space-y-2 text-center rounded-2xl px-5 py-6 bg-[#E7E9EE]">
                <p className="text-xl md:text-2xl font-semibold tracking-tight text-(--fg)">
                  Lithic
                </p>
                <p className="text-lg md:text-xl text-(--muted)">
                  Card issuing rails
                </p>
              </div>
              <div className="space-y-2 text-center rounded-2xl px-5 py-6 bg-[#EFF1F4]">
                <p className="text-xl md:text-2xl font-semibold tracking-tight text-(--fg)">
                  Bridge
                </p>
                <p className="text-lg md:text-xl text-(--muted)">
                  Off-ramp settlement
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">Solution</h3>
            <p>
              We created a personalized router contract that gave every user an
              on-chain address tied to their bank account. Funds could be sent
              from a connected wallet, a third-party wallet, or a personalized
              “Pay me” URL, then swapped and routed to fiat.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">
              Early interface
            </h3>
            <figure className="w-[calc(100vw-4rem)] relative left-1/2 right-1/2 -ml-[calc(50vw-2rem)] -mr-[calc(50vw-2rem)] my-8 md:my-10">
              <Image
                src="/images/skyteller-early-interface.jpg"
                alt="Early Skyteller web interface before the redesign"
                width={1600}
                height={1000}
                className="w-full h-auto rounded-3xl shadow-[0_14px_36px_rgba(15,23,42,0.16)]"
              />
              <figcaption className="mt-4 text-base md:text-lg text-(--muted)">
                Early web interface explorations before the redesign pass.
              </figcaption>
            </figure>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">
              How the flow worked
            </h3>
            <p>
              Users connected a non-custodial wallet and a bank account via
              Plaid. When a transfer was initiated, funds were swapped into
              USDC, sent to an off-ramp partner, converted to USD, and routed to
              the connected bank account. A transaction timeline kept users
              informed at each step.
            </p>
            <figure className="w-[calc(100vw-4rem)] relative left-1/2 right-1/2 -ml-[calc(50vw-2rem)] -mr-[calc(50vw-2rem)] my-8 md:my-10">
              <Image
                src="/images/skyteller-core-flow.jpg"
                alt="Skyteller core funds flow diagram"
                width={1400}
                height={900}
                className="w-full h-auto rounded-3xl shadow-[0_12px_30px_rgba(15,23,42,0.16)]"
              />
              <figcaption className="mt-4 text-base md:text-lg text-(--muted)">
                Funds move from wallet to router, swap to USDC, and settle to a
                linked bank account.
              </figcaption>
            </figure>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">
              Onboarding and trust
            </h3>
            <p>
              Because the product handled real money, trust was critical. We
              designed onboarding around KYC verification, clear risk
              assessments, and explicit consent for wallet and bank connections.
            </p>
            <figure className="w-[calc(100vw-4rem)] relative left-1/2 right-1/2 -ml-[calc(50vw-2rem)] -mr-[calc(50vw-2rem)] my-8 md:my-10">
              <Image
                src="/images/skyteller-onboarding.jpg"
                alt="Skyteller onboarding screens"
                width={1600}
                height={1000}
                className="w-full h-auto rounded-3xl shadow-[0_14px_36px_rgba(15,23,42,0.16)]"
              />
              <figcaption className="mt-4 text-base md:text-lg text-(--muted)">
                Guided onboarding to connect wallet and verify identity.
              </figcaption>
            </figure>
            <figure className="w-[calc(100vw-4rem)] relative left-1/2 right-1/2 -ml-[calc(50vw-2rem)] -mr-[calc(50vw-2rem)] my-8 md:my-10">
              <Image
                src="/images/skyteller-onboarding-alt.jpg"
                alt="Skyteller onboarding verification flow"
                width={1600}
                height={1000}
                className="w-full h-auto rounded-3xl shadow-[0_14px_36px_rgba(15,23,42,0.16)]"
              />
              <figcaption className="mt-4 text-base md:text-lg text-(--muted)">
                KYC verification and consent checkpoints for safe activation.
              </figcaption>
            </figure>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">
              Architecture highlights
            </h3>
            <ul>
              <li>Next.js front end with wagmi and RainbowKit for wallets.</li>
              <li>Firebase + Cloud Functions for event processing.</li>
              <li>
                Plaid for bank connectivity, Persona for KYC, and Bridge for
                off-ramp settlement.
              </li>
              <li>Lithic for debit card issuing exploration.</li>
              <li>
                A homegrown chain watcher for real-time risk assessment.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">
              Technical challenges
            </h3>
            <p>
              Much of the web3 stack was early and unstable. Wallet adapters,
              authentication flows like Sign-In With Ethereum, and chain
              providers lacked consistent documentation and had edge cases that
              surfaced only in production-like testing. We built additional
              abstraction layers, added defensive UI states, and wrote fallback
              flows to handle wallet disconnects, signature failures, and
              session persistence across devices.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">
              Rollout approach
            </h3>
            <p>
              We started with a waitlist and friends-and-family cohorts, then
              expanded access once the onboarding and off-ramp flows were
              stable. This staged rollout helped us tune risk thresholds,
              support workflows, and user communication.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">Conclusion</h3>
            <p>
              By summer 2023, the crypto downturn and fundraising headwinds
              left us without a sustainable path forward. We made the hard,
              responsible call to shut down Galactic and sunset the product
              only weeks after launch. It wasn’t the most delightful project
              I’ve worked on, but it taught me a ton—about technical
              foundations, risk, and how to ship in an emerging ecosystem.
              Even with the timing working against us, it was meaningful to
              help build something truly cutting-edge.
            </p>
          </section>
        </WorkDetailLayout>
      </main>
    </div>
  );
}
