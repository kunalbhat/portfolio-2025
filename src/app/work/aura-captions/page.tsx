"use client";

import SiteHeader from "@/components/site-header";
import WorkDetailLayout from "@/components/work-detail-layout";

export default function AuraCaptionsPage() {
  return (
    <div className="max-w-4xl px-6 md:px-16 pt-20 md:pt-28 mx-auto transition-colors duration-650 ease-[cubic-bezier(0.25,0.8,0.35,1)]">
      <SiteHeader />
      <main className="py-10 md:py-14 min-h-screen">
        <WorkDetailLayout
          title="Aura Captions"
          summary="From 0-5M photo captions, I launched a brand new multi-surface experience that helped Aura users bring more context to cherished memories."
        >
          <section className="space-y-4">
            <p>
              Case study in progress. I am happy to share the research approach,
              roll-out plan, and impact in a live walkthrough.
            </p>
          </section>
        </WorkDetailLayout>
      </main>
    </div>
  );
}
