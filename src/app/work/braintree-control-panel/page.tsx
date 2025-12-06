"use client";

import SiteHeader from "@/components/site-header";
import WorkDetailLayout from "@/components/work-detail-layout";

export default function BraintreeControlPanelPage() {
  return (
    <div className="max-w-4xl px-6 md:px-16 pt-20 md:pt-28 mx-auto transition-colors duration-650 ease-[cubic-bezier(0.25,0.8,0.35,1)]">
      <SiteHeader />
      <main className="py-10 md:py-14 min-h-screen">
        <WorkDetailLayout
          title="Braintree Control Panel"
          summary="As a PM, I led the redesign of Braintree's merchant dashboard used by companies like Uber and Airbnb to manage their payments."
        >
          <section className="space-y-4">
            <p>
              Detailed write-up in progress. I can share the research insights,
              design approach, and rollout results on request.
            </p>
          </section>
        </WorkDetailLayout>
      </main>
    </div>
  );
}
