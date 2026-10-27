// Section content. All copy comes from earlier versions of kunalbhat.com.

/**
 * @typedef {{ title: string, meta?: string, text: string, href?: string, linkLabel?: string }} Item
 * @typedef {{ id: string, title: string, eyebrow: string, lede?: string, items?: Item[], html?: string }} Section
 */

/** @type {Record<string, Section>} */
export const SECTIONS = {
  work: {
    id: "work",
    eyebrow: "On the monitor",
    title: "Selected work",
    lede: "Product design across consumer hardware, mobility, identity and payments.",
    items: [
      {
        title: "Aura Text-to-Frame",
        meta: "Aura",
        text: "Helping families share moments to their Aura frames even more seamlessly with rich messaging.",
        href: "https://www.theverge.com/news/840142/aura-text-to-frame-digital-picture-frame-share-photos",
        linkLabel: "Coverage in The Verge",
      },
      {
        title: "Aura Captions",
        meta: "Aura · 2024",
        text: "From 0 → millions of photo captions, I launched a brand new multi-surface experience that let Aura users add context to cherished memories.",
        href: "https://help.auraframes.com/hc/en-us/articles/29957049062679-On-Frame-Captions",
        linkLabel: "How captions work",
      },
      {
        title: "Waymo",
        meta: "Through Magic+Might",
        text: "Explored rider sentiment on personalization and in-car preferences — resulting in the new My Car tab in the Waymo app.",
        href: "https://www.instagram.com/reel/DOwM55uErwy/",
        linkLabel: "See My Car",
      },
      {
        title: "CLEAR",
        text: "Redesigned the white-label security lane reservation experience for CLEAR.",
        href: "https://www.clearme.com/clear-mobile/sdf",
        linkLabel: "The live experience",
      },
      {
        title: "Skyteller",
        meta: "Galactic",
        text: "I helped build Skyteller, a DeFi off-ramp that turned crypto into cash in your bank account in one click.",
      },
      {
        title: "Braintree Control Panel",
        meta: "PayPal",
        text: "I led the redesign of Braintree’s control panel to simplify how merchants set up and run payments at scale.",
      },
    ],
  },
  builds: {
    id: "builds",
    eyebrow: "On the Mac mini",
    title: "Builds",
    lede: "Designing and building go hand in hand for me.",
    items: [
      {
        title: "This desk",
        meta: "Blender · Python · HTML",
        text: "Every object here is modelled, lit and rendered from Python scripts in Blender with one shared camera and light rig, then composed in the browser.",
      },
      {
        title: "AI Nutrition Coach",
        text: "I built a ChatGPT-powered workflow to optimize my diet and lower my A1C, delivering measurable outcomes.",
      },
      {
        title: "TRMNL Spotify Plugin",
        text: "A Spotify recently played plugin for the TRMNL e-ink display.",
      },
      {
        title: "Freddie Alerts",
        text: "Small Ruby web-scraping utility for Mailchimp giveaways.",
      },
    ],
  },
  play: {
    id: "play",
    eyebrow: "The cube",
    title: "Play",
    lede: "Games and puzzle interfaces.",
    items: [
      {
        title: "Paracute",
        meta: "In progress",
        text: "A 2D game where falling is the mechanic. Navigate through a multi-stage mountain, adapting to changing terrains and hazards as each level pushes precision and control further.",
        href: "https://paracute-game.vercel.app",
        linkLabel: "Play the prototype",
      },
      {
        title: "Grid Arcana",
        text: "My first game-adjacent app: reflect on a daily omen and arrange symbols on a grid to shape its meaning.",
        href: "https://www.gridarcana.com",
        linkLabel: "gridarcana.com",
      },
      {
        title: "Maze of Games",
        text: "Interactive puzzle interfaces inspired by the Maze of Games novel.",
      },
    ],
  },
  about: {
    id: "about",
    eyebrow: "The notebook",
    title: "About",
    html: `
      <p class="lede">Greetings — I’m Kunal, a Chicago-based designer and curious builder.</p>
      <p>With nearly two decades of experience across design, product management, and engineering, I’m an end-to-end contributor who leads through collaboration.</p>
      <p>I’m most at home in 0→1 product definition, prototyping, user research, and shipping work informed by clear data and validated through measurable impact.</p>
      <h3>Experience</h3>
      <ol class="timeline">
        <li><span class="when">2024 – Present</span><p>At <b>Aura</b>, I design experiences in our iOS, Android, and frame surfaces, building for growth experimentation and leading product research to uncover our next big strategic opportunities.</p></li>
        <li><span class="when">2023 – 2024</span><p>Through <b>Magic+Might</b> — a design and innovation consultancy — I dove deep into the autonomous ride-hail space working with Waymo to understand rider sentiment and design future experiences.</p></li>
        <li><span class="when">2021 – 2023</span><p>At <b>Galactic</b>, a seed-stage startup, I took on an engineering role and explored crypto by building products that bridged the traditional finance world with web3.</p></li>
        <li><span class="when">2015 – 2021</span><p>Six years at <b>PayPal</b> as a PM, building merchant experiences from rearchitecting Braintree’s merchant dashboard to going deep into the Identity domain. I launched Braintree’s Enterprise SSO and led the Identity component of PayPal’s platform unification efforts.</p></li>
        <li><span class="when">2014 – 2015</span><p>I joined PayPal via its acquisition of <b>Modest</b>, where I led design and built a contextual commerce platform for small and medium businesses.</p></li>
        <li><span class="when">2009 – 2014</span><p>At <b>gravitytank</b> I imagined future experiences for companies like Skype, Coinstar, and Samsung, then helped design and build the first major iterations of Dscout’s mobile research platform.</p></li>
      </ol>
      <p>Outside of work, I enjoy tennis, chess, and doing my daily puzzles.</p>
      <p><a href="https://www.linkedin.com/in/kunal-s-bhat/" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a></p>
    `,
  },
};

export const SECTION_ORDER = ["work", "builds", "play", "about"];
