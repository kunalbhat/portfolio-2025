"use client";

import SiteHeader from "@/components/site-header";
import WorkDetailLayout from "@/components/work-detail-layout";

export default function SkytellerPage() {
  return (
    <div className="max-w-4xl px-6 md:px-16 pt-20 md:pt-28 mx-auto transition-colors duration-650 ease-[cubic-bezier(0.25,0.8,0.35,1)]">
      <SiteHeader />
      <main className="py-10 md:py-14 min-h-screen">
        <WorkDetailLayout
          title="Skyteller"
          summary="As an engineer, I helped build Skyteller, a defi off-ramp that turned crypto into cash in your bank account in one click."
        >
          <section className="space-y-4">
            <p>
              Case study coming soon. I can walk through the build, tech stack,
              and launch learnings live if that is helpful.
            </p>
          </section>
        </WorkDetailLayout>
      </main>
    </div>
  );
}
