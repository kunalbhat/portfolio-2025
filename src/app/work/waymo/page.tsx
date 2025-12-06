"use client";

import SiteHeader from "@/components/site-header";
import WorkDetailLayout from "@/components/work-detail-layout";

export default function WaymoPage() {
  return (
    <div className="max-w-4xl px-6 md:px-16 pt-20 md:pt-28 mx-auto transition-colors duration-650 ease-[cubic-bezier(0.25,0.8,0.35,1)]">
      <SiteHeader />
      <main className="py-10 md:py-14 min-h-screen">
        <WorkDetailLayout
          title="Waymo - My Car"
          summary="Explored rider sentiment on personalization and in-car preferences, resulting in the new My Car tab in the Waymo app."
        >
          <section className="space-y-4">
            <p>
              Full write-up is coming soon. In the meantime, I can share the
              research plan, artifacts, and learnings privately.
            </p>
          </section>
        </WorkDetailLayout>
      </main>
    </div>
  );
}
