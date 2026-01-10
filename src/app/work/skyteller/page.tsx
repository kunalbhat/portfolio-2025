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
          <figure className="w-[calc(100vw-4rem)] relative left-1/2 right-1/2 -ml-[calc(50vw-2rem)] -mr-[calc(50vw-2rem)] my-10 md:my-12 rounded-3xl bg-(--bg-overlay) shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
            <Image
              src="/images/skyteller-light.png"
              alt="Skyteller product hero"
              width={1600}
              height={1000}
              className="w-full h-auto rounded-2xl shadow-[0_14px_36px_rgba(15,23,42,0.16)]"
              priority
            />
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
                  Engineer + Product
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
              Buying crypto has become easy, but getting it back into spendable
              fiat has historically been a multi-step, fee-heavy process.
              Exchanges can fail, wallets can be misused, and every hop adds
              risk. For people earning income in crypto, the consequences are
              real. We wanted to make off-ramping simple, secure, and
              trustworthy.
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
            <h3 className="text-xl md:text-2xl font-semibold">Solution</h3>
            <p>
              We created a personalized router contract that gave every user an
              on-chain address tied to their bank account. Funds could be sent
              from a connected wallet, a third-party wallet, or a personalized
              “Pay me” URL, then swapped and routed to fiat.
            </p>
            <figure className="w-[calc(100vw-4rem)] relative left-1/2 right-1/2 -ml-[calc(50vw-2rem)] -mr-[calc(50vw-2rem)] my-8 md:my-10 rounded-2xl bg-(--bg-overlay) shadow-[0_16px_40px_rgba(15,23,42,0.16)]">
              <Image
                src="/images/skyteller-core-screens.png"
                alt="Skyteller core product screens"
                width={1600}
                height={1000}
                className="w-full h-auto rounded-2xl shadow-[0_12px_30px_rgba(15,23,42,0.16)]"
                priority
              />
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
            <figure className="w-[calc(100%+2rem)] md:w-[calc(100%+3rem)] mx-auto my-8 md:my-10 rounded-2xl bg-(--bg-overlay) shadow-[0_16px_40px_rgba(15,23,42,0.16)]">
              <Image
                src="/images/skyteller-core-flows.png"
                alt="Skyteller core funds flow diagram"
                width={1400}
                height={900}
                className="w-full h-auto rounded-xl shadow-[0_12px_30px_rgba(15,23,42,0.16)]"
              />
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
            <div className="grid gap-6 md:grid-cols-2">
              <figure className="rounded-2xl bg-(--bg-overlay) shadow-[0_16px_40px_rgba(15,23,42,0.16)]">
                <Image
                  src="/images/skyteller-onboarding-1.png"
                  alt="Skyteller onboarding screens"
                  width={1200}
                  height={900}
                  className="w-full h-auto rounded-2xl shadow-[0_12px_30px_rgba(15,23,42,0.16)]"
                />
              </figure>
              <figure className="rounded-2xl bg-(--bg-overlay) shadow-[0_16px_40px_rgba(15,23,42,0.16)]">
                <Image
                  src="/images/skyteller-onboarding-2.png"
                  alt="Skyteller onboarding verification flow"
                  width={1200}
                  height={900}
                  className="w-full h-auto rounded-2xl shadow-[0_12px_30px_rgba(15,23,42,0.16)]"
                />
              </figure>
            </div>
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
              <li>
                A homegrown chain watcher for real-time risk assessment.
              </li>
            </ul>
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
            <h3 className="text-xl md:text-2xl font-semibold">What’s next</h3>
            <p>
              The router architecture set the stage for additional financial
              tools like bill pay, P2P transfers, and card programs, while
              keeping the core off-ramp experience simple and reliable.
            </p>
          </section>
        </WorkDetailLayout>
      </main>
    </div>
  );
}
