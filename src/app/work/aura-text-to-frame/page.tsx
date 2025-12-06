"use client";

import SiteHeader from "@/components/site-header";
import WorkDetailLayout from "@/components/work-detail-layout";

export default function AuraTextToFramePage() {
  return (
    <div className="max-w-4xl px-6 md:px-16 pt-20 md:pt-28 mx-auto transition-colors duration-650 ease-[cubic-bezier(0.25,0.8,0.35,1)]">
      <SiteHeader />
      <main className="py-10 md:py-14 min-h-screen">
        <WorkDetailLayout
          title="Aura Text-to-Frame"
          summary="Helping families share moments to their Aura frames even more seamlessly with rich messaging."
        >
          <section className="space-y-4">
            <p>
              Full write-up coming soon. Reach out if you want a deeper
              walkthrough of the messaging experiments and rollout plan.
            </p>
          </section>
        </WorkDetailLayout>
      </main>
    </div>
  );
}
