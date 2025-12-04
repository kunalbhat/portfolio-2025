"use client";

import Image from "next/image";
import SiteHeader from "@/components/site-header";
import WorkDetailLayout from "@/components/work-detail-layout";

export default function FreddieAlertsCaseStudyPage() {
  return (
    <div className="max-w-4xl px-6 md:px-16 pt-20 md:pt-28 mx-auto transition-colors duration-650 ease-[cubic-bezier(0.25,0.8,0.35,1)]">
      <SiteHeader />
      <main className="py-10 md:py-14 min-h-screen">
        <WorkDetailLayout
          title="Freddie Alerts — Never miss a new Freddie"
          summary="A scraper + notifier that watches Mailchimp giveaways and pings me the moment a new Freddie drops."
        >
          <figure className="mb-8">
            <Image
              src="https://raw.githubusercontent.com/kunalbhat/replyall-scraper/master/screenshots/all_gone.png"
              alt="Freddie Alerts - All gone state"
              width={1600}
              height={1000}
              className="w-full h-auto rounded-2xl border border-(--border) bg-(--bg-overlay)"
              priority
            />
          </figure>

          <section className="space-y-4">
            <p>
              A small utility that scrapes mailchimp.com/replyall on an interval
              and alerts me if a new Freddie is available. These giveaways
              vanish fast, so the goal was simple: check often, compare against
              the last seen Freddie, and notify immediately.
            </p>
            <blockquote className="border-l-4 border-(--border) pl-4 text-(--muted)">
              Dismayed to miss out on the Gold Freddie, I vowed to never let it
              happen again.
            </blockquote>
          </section>

          <section className="space-y-3">
            <h3 className="text-xl md:text-2xl font-semibold">What it does</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Scrape a page and capture the current Freddie id.</li>
              <li>Compare it to the stored value; update when it changes.</li>
              <li>Send an email if a new Freddie appears.</li>
            </ul>
            <p>Built with Ruby, Nokogiri, Heroku Scheduler, and Mailgun.</p>
          </section>

          <section className="space-y-6">
            <h3 className="text-xl md:text-2xl font-semibold">How it works</h3>

            <div className="space-y-3">
              <h4 className="text-lg font-semibold">Nokogiri</h4>
              <p>
                Nokogiri parses the Reply All page, pulling the first
                <code className="px-1">div.freddie</code> element to identify
                the currently featured Freddie.
              </p>
              <pre className="rounded-2xl bg-(--bg-overlay) border border-(--border) p-4 overflow-auto text-sm">
                <code>{`doc = Nokogiri::HTML(open("http://www.mailchimp.com/replyall"))
@freddies = doc.css("div.freddie")

@active_freddie = @freddies.first['id']`}</code>
              </pre>
              <p>
                The fetched id is compared against the stored id; if they
                differ, a notification is triggered and the stored value is
                updated.
              </p>
              <pre className="rounded-2xl bg-(--bg-overlay) border border-(--border) p-4 overflow-auto text-sm">
                <code>{`if @active_freddie != old_freddie
  # Send notification
  # Update stored Freddie value
end`}</code>
              </pre>
            </div>

            <div className="space-y-3">
              <h4 className="text-lg font-semibold">Heroku Scheduler</h4>
              <p>
                Scheduler runs the scraper task hourly so the window to grab a
                free Freddie stays small.
              </p>
              <pre className="rounded-2xl bg-(--bg-overlay) border border-(--border) p-4 overflow-auto text-sm">
                <code>{`task :default do
  desc "Scrape the page task run by Scheduler"
  get_freddie
end`}</code>
              </pre>
              <figure className="mt-3">
                <Image
                  src="https://raw.githubusercontent.com/kunalbhat/replyall-scraper/master/screenshots/heroku-scheduler.png"
                  alt="Heroku Scheduler UI showing the task"
                  width={1200}
                  height={800}
                  className="w-full h-auto rounded-2xl border border-(--border) bg-(--bg-overlay)"
                />
              </figure>
            </div>

            <div className="space-y-3">
              <h4 className="text-lg font-semibold">Mailgun</h4>
              <p>
                Mailgun fires the email when a new Freddie is detected so I can
                claim it before it disappears.
              </p>
              <figure className="mt-3">
                <Image
                  src="https://raw.githubusercontent.com/kunalbhat/replyall-scraper/master/screenshots/mailgun_notification.png"
                  alt="Mailgun notification email for a new Freddie"
                  width={1200}
                  height={800}
                  className="w-full h-auto rounded-2xl border border-(--border) bg-(--bg-overlay)"
                />
              </figure>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xl md:text-2xl font-semibold">Configuration</h3>
            <p>
              Environment variables are stored locally in <code>.env</code> and
              in the Heroku app config:
            </p>
            <pre className="rounded-2xl bg-(--bg-overlay) border border-(--border) p-4 overflow-auto text-sm">
              <code>{`DATABASE_URL=<value>
MAILGUN_API_KEY=<value>
MAILGUN_FROM=<value>
MAILGUN_FROM_NAME=<value>
MAILGUN_TO=<value>
MAILGUN_TO_NAME=<value>`}</code>
            </pre>
          </section>
        </WorkDetailLayout>
      </main>
    </div>
  );
}
