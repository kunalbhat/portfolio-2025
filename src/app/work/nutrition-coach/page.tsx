"use client";

import SiteHeader from "@/components/site-header";
import WorkDetailLayout from "@/components/work-detail-layout";

export default function NutritionCoachPage() {
  return (
    <div className="max-w-4xl px-6 md:px-16 pt-20 md:pt-28 mx-auto transition-colors duration-650 ease-[cubic-bezier(0.25,0.8,0.35,1)]">
      <SiteHeader />
      <main className="py-10 md:py-14 min-h-screen">
        <WorkDetailLayout
          title="Nutrition Coach"
          summary="I built a ChatGPT powered nutrition coach to help lower my A1C."
        >
          <section className="space-y-4">
            <p>
              More details soon. If you want to see the prototype and workflow,
              I am happy to walk through the experiment and learnings.
            </p>
          </section>
        </WorkDetailLayout>
      </main>
    </div>
  );
}
