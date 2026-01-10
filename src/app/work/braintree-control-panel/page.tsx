"use client";

import Image from "next/image";
import SiteHeader from "@/components/site-header";
import WorkDetailLayout from "@/components/work-detail-layout";

export default function BraintreeControlPanelPage() {
  return (
    <div className="max-w-4xl px-6 md:px-16 pt-20 md:pt-28 mx-auto transition-colors duration-650 ease-[cubic-bezier(0.25,0.8,0.35,1)]">
      <SiteHeader />
      <main className="py-10 md:py-14 min-h-screen">
        <WorkDetailLayout
          title="Braintree Control Panel"
          summary="Rebuilding the merchant control panel into a cohesive, scalable experience for configuring and operating payments at scale."
        >
          <figure className="w-[calc(100vw-4rem)] relative left-1/2 right-1/2 -ml-[calc(50vw-2rem)] -mr-[calc(50vw-2rem)] my-10 md:my-12 rounded-3xl bg-(--bg-overlay) shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
            <Image
              src="/images/braintree-control-panel-3.webp"
              alt="Updated Braintree control panel design system and UI"
              width={1600}
              height={1000}
              className="w-full h-auto rounded-2xl shadow-[0_14px_36px_rgba(15,23,42,0.16)]"
              priority
              unoptimized
            />
          </figure>

          <section className="space-y-6">
            <p>
              The Braintree control panel is the operational hub where merchants
              configure payments, monitor transactions, resolve disputes, and
              manage data access. I led a cross-functional effort to modernize a
              legacy product into a consistent experience with a clearer visual
              identity, partnering daily with design, engineering, support,
              accounts, and risk.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-(--border) bg-(--bg-overlay) p-4 md:p-6 space-y-2">
                <p className="text-sm uppercase tracking-[0.2em] text-(--muted)">
                  Role
                </p>
                <p className="text-lg md:text-xl font-semibold">
                  Product Manager
                </p>
              </div>
              <div className="rounded-2xl border border-(--border) bg-(--bg-overlay) p-4 md:p-6 space-y-2">
                <p className="text-sm uppercase tracking-[0.2em] text-(--muted)">
                  Responsibilities
                </p>
                <p className="text-lg md:text-xl font-semibold">
                  Discovery, research, strategy, stakeholder alignment, rollout
                  planning, documentation, launch
                </p>
              </div>
              <div className="rounded-2xl border border-(--border) bg-(--bg-overlay) p-4 md:p-6 space-y-2">
                <p className="text-sm uppercase tracking-[0.2em] text-(--muted)">
                  Timeline
                </p>
                <p className="text-lg md:text-xl font-semibold">1+ years</p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">Impact</h3>
            <p className="text-lg md:text-xl text-(--muted)">
              The rebuild shipped measurable adoption gains while laying the
              groundwork for broader platform unification.
            </p>
            <div className="grid gap-8 md:grid-cols-3 py-4 md:py-6">
              <div className="space-y-2 text-center rounded-2xl px-5 py-6 bg-[#F2F3F6]">
                <p className="text-3xl md:text-4xl font-semibold tracking-tight text-(--fg)">
                  65%
                </p>
                <p className="text-lg md:text-xl text-(--muted)">
                  Merchant self-adoption
                </p>
              </div>
              <div className="space-y-2 text-center rounded-2xl px-5 py-6 bg-[#E7E9EE]">
                <p className="text-3xl md:text-4xl font-semibold tracking-tight text-(--fg)">
                  100%
                </p>
                <p className="text-lg md:text-xl text-(--muted)">
                  Rollout coverage
                </p>
              </div>
              <div className="space-y-2 text-center rounded-2xl px-5 py-6 bg-[#EFF1F4]">
                <p className="text-3xl md:text-4xl font-semibold tracking-tight text-(--fg)">
                  Foundation
                </p>
                <p className="text-lg md:text-xl text-(--muted)">
                  PayPal + Braintree unification
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">
              Context and scope
            </h3>
            <p>
              The control panel powers reporting, payment configuration,
              refunds, chargebacks, and integrations. Over years of incremental
              change, the product lost coherence: patterns diverged, ownership
              was fragmented, and support load continued to climb.
            </p>
            <figure className="w-[calc(100vw-4rem)] relative left-1/2 right-1/2 -ml-[calc(50vw-2rem)] -mr-[calc(50vw-2rem)] my-8 md:my-10 rounded-2xl bg-(--bg-overlay) shadow-[0_16px_40px_rgba(15,23,42,0.16)]">
              <Image
                src="/images/braintree-control-panel-1.webp"
                alt="Legacy Braintree control panel interface"
                width={1400}
                height={900}
                className="w-full h-auto rounded-xl shadow-[0_12px_30px_rgba(15,23,42,0.16)]"
                priority
              />
            </figure>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">The challenge</h3>
            <ul>
              <li>Product: no single owner and uneven UX quality.</li>
              <li>Business: competitive pressure from fast-moving rivals.</li>
              <li>Engineering: a looming platform migration.</li>
              <li>Support: growing operational burden for merchants.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">Goals</h3>
            <ul>
              <li>
                Clarify core workflows by understanding who uses the panel and
                why.
              </li>
              <li>
                Surface insights in context so merchants can act without
                digging.
              </li>
              <li>
                Reduce support tickets by removing friction and enabling
                self-service.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">
              Discovery and research
            </h3>
            <p>
              We combined qualitative and quantitative inputs to reveal both
              behavior and sentiment. I led interviews with merchant users,
              instrumented the legacy interface to understand real workflows,
              and synthesized years of survey data with support and account
              insights.
            </p>
            <p>
              That work produced a set of personas that grounded decisions and
              clarified the differences between daily operators, finance teams,
              and technical admins.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">
              Designing for real-world variance
            </h3>
            <p>
              Merchants differ in size, sophistication, and workflow. The
              product needed to serve edge cases without sacrificing the core
              flows that most teams rely on. We balanced flexible pathways with
              consistent navigation and predictable UI patterns.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">
              Information architecture and system design
            </h3>
            <p>
              We restructured the IA to mirror how merchants think about their
              jobs, creating a durable foundation for future expansion. In
              parallel, we built a shared UI library that aligned the product
              with Braintree&apos;s brand while enabling multiple engineering
              teams to ship consistently.
            </p>
            <figure className="w-[calc(100%+2rem)] md:w-[calc(100%+3rem)] mx-auto my-8 md:my-10 rounded-2xl bg-(--bg-overlay) shadow-[0_16px_40px_rgba(15,23,42,0.16)]">
              <Image
                src="/images/braintree-dashboard.gif"
                alt="Braintree control panel overview"
                width={1400}
                height={900}
                className="w-full h-auto rounded-xl shadow-[0_12px_30px_rgba(15,23,42,0.16)]"
                priority
              />
            </figure>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">
              Deep dive: disputes experience
            </h3>
            <p>
              Disputes are one of the most time-sensitive workflows in the
              control panel. We focused on making them easier to find, easier
              to triage, and faster to resolve, while also helping merchants
              improve win rates and reduce dispute volume over time.
            </p>
            <figure className="w-[calc(100vw-4rem)] relative left-1/2 right-1/2 -ml-[calc(50vw-2rem)] -mr-[calc(50vw-2rem)] my-8 md:my-10 rounded-3xl bg-(--bg-overlay) shadow-[0_12px_32px_rgba(15,23,42,0.14)]">
              <Image
                src="/images/braintree-disputes-cover.webp"
                alt="Disputes overview in the Braintree control panel"
                width={1600}
                height={1000}
                className="w-full h-auto rounded-2xl shadow-[0_14px_36px_rgba(15,23,42,0.16)]"
                priority
              />
            </figure>
            <p>
              The direction was shaped by direct merchant feedback, interviews
              with internal teams who support dispute resolution, and usage data
              from the disputes section.
            </p>
            <ul>
              <li>
                Surfaced disputes in top-level navigation for quicker access.
              </li>
              <li>
                Introduced a clearer, scannable table of all disputes by
                default.
              </li>
              <li>
                Created workflow-driven queues (Needs Response, Under Review,
                Complete) to keep attention on what matters now.
              </li>
              <li>
                Clarified status definitions so merchants can decide how to
                respond with confidence.
              </li>
              <li>
                Added fast, flexible filtering that updates results
                immediately.
              </li>
            </ul>
            <figure className="w-[calc(100%+2rem)] md:w-[calc(100%+3rem)] mx-auto my-8 md:my-10 rounded-2xl bg-(--bg-overlay) shadow-[0_16px_40px_rgba(15,23,42,0.16)]">
              <Image
                src="/images/braintree-disputes-animation.gif"
                alt="Disputes queue experience animation"
                width={1400}
                height={900}
                className="w-full h-auto rounded-xl shadow-[0_12px_30px_rgba(15,23,42,0.16)]"
                unoptimized
              />
            </figure>
            <figure className="w-[calc(100%+2rem)] md:w-[calc(100%+3rem)] mx-auto my-8 md:my-10 rounded-2xl bg-(--bg-overlay) shadow-[0_16px_40px_rgba(15,23,42,0.16)]">
              <Image
                src="/images/braintree-disputes-reasons.webp"
                alt="Dispute status descriptions and reasons"
                width={1400}
                height={900}
                className="w-full h-auto rounded-xl shadow-[0_12px_30px_rgba(15,23,42,0.16)]"
                priority
              />
            </figure>
            <figure className="w-[calc(100%+2rem)] md:w-[calc(100%+3rem)] mx-auto my-8 md:my-10 rounded-2xl bg-(--bg-overlay) shadow-[0_16px_40px_rgba(15,23,42,0.16)]">
              <Image
                src="/images/braintree-disputes-filtering.gif"
                alt="Filtering disputes by status and attributes"
                width={1400}
                height={900}
                className="w-full h-auto rounded-xl shadow-[0_12px_30px_rgba(15,23,42,0.16)]"
                unoptimized
              />
            </figure>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">
              Merchant validation
            </h3>
            <p>
              We used account managers to recruit top merchants for previews,
              bringing fresh feedback into the process and re-energizing
              relationships. Design and engineering joined the sessions to hear
              feedback directly, and the work gained visibility with leadership
              through consistent updates.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">Rollout</h3>
            <p>
              To mitigate risk, I designed a phased rollout plan starting with
              alpha previews for merchants like Uber, Stitch Fix, and Airbnb,
              followed by internal testing. Engineering built a bridge that let
              the old and new interfaces coexist, allowing merchants to adopt
              the new experience without disruption.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">Impact</h3>
            <ul>
              <li>65% merchant self-adoption of the new UI.</li>
              <li>
                Established groundwork for PayPal + Braintree platform
                unification.
              </li>
              <li>
                Rolled out to 100% of merchants with updated documentation.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">
              Challenges and learnings
            </h3>
            <ul>
              <li>
                Legacy constraints created uncertainty in scope and timelines.
              </li>
              <li>Technical challenges were unpredictable.</li>
              <li>Cross-team dependencies required constant coordination.</li>
              <li>
                Clear, frequent communication kept leadership aligned on
                progress and value.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">What’s next</h3>
            <p>
              The new control panel is a foundation for ongoing improvements,
              making it easier to evolve workflows and launch new capabilities
              as merchant needs grow.
            </p>
          </section>
        </WorkDetailLayout>
      </main>
    </div>
  );
}
