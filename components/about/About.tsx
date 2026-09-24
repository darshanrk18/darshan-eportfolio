/**
 * §4.4 About — `README.md`, rendered. RSC shell.
 *
 * Split view mimicking a Markdown editor: left = raw source (SourcePane,
 * aria-hidden garnish), right = rendered result (serif pull-quote, the three
 * CONTENT_FINAL About paragraphs verbatim with serif-italic em phrases, stat
 * chips with count-ups). The source↔render wormhole and the mobile `view source`
 * toggle live in Wormhole.client.tsx; both panes stay server-rendered.
 */

import SectionHeader from '@/components/chrome/SectionHeader'
import SourcePane from '@/components/about/SourcePane'
import Wormhole from '@/components/about/Wormhole.client'
import StatChips from '@/components/about/StatChips'
import PortraitIsland from '@/components/about/PortraitIsland'

function RenderedPane() {
  return (
    <div className="max-w-[65ch]">
      <blockquote
        data-line="quote"
        tabIndex={0}
        aria-describedby="about-wormhole-hint"
        className="type-display-quote mb-8 text-primary"
      >
        &ldquo;I build software the way good code reads: clear, intentional, and built to
        last.&rdquo;
      </blockquote>

      {/* §2.1 responsive placement: <lg the portrait is a static block in the
          rendered flow (no ASCII sweep, tap toggles color); ≥lg it lives in
          the sticky source column as the asset pane below. */}
      <div className="mb-8 lg:hidden">
        <PortraitIsland variant="static" />
      </div>

      <div className="space-y-6">
        <p
          data-line="p1"
          tabIndex={0}
          aria-describedby="about-wormhole-hint"
          className="type-body text-primary"
        >
          I&#39;m a software engineer in Boston, finishing my MS in Computer Science at
          Northeastern and joining <em className="font-serif">Amazon Web Services</em> as a
          Software Development Engineer in January 2027.
        </p>
        <p
          data-line="p2"
          tabIndex={0}
          aria-describedby="about-wormhole-hint"
          className="type-body text-primary"
        >
          Last summer at AWS I built a serverless system that captures visual evidence for
          cloud-security workflows — Java, Python, Lambda, and infrastructure as code, tested to{' '}
          <em className="font-serif">100% coverage</em> against a live AWS environment. Before grad
          school I spent three years at Schneider Electric shipping applications used by{' '}
          <em className="font-serif">10,000+ employees</em> and earning the SURGE Award.
        </p>
        <p
          data-line="p3"
          tabIndex={0}
          aria-describedby="about-wormhole-hint"
          className="type-body text-primary"
        >
          My ticket-assignment system Ticket-Forge took{' '}
          <em className="font-serif">3rd place at the Google MLOps Project Expo</em>; my research
          on medical-sample allocation is published with <em className="font-serif">IEEE</em>; and
          as a teaching assistant I mentored <em className="font-serif">300+ graduate students</em>{' '}
          in software design. I like taking systems from prototype to production — and proving
          they work.
        </p>
      </div>

      <div className="mt-8">
        <StatChips />
      </div>
    </div>
  )
}

export default function About() {
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="section-pad"
      data-component="About"
      data-island="RSC"
      style={{ ['--vs-i' as string]: 1 }}
    >
      <div className="container-site">
        <SectionHeader
          index="01"
          name="ABOUT"
          file="about.md"
          headingId="about-heading"
          headline="A README, rendered."
        />
        <p id="about-wormhole-hint" className="sr-only">
          Interactive block — hovering or focusing it highlights the matching line in the
          decorative markdown source view beside the text.
        </p>
        <Wormhole
          source={<SourcePane />}
          asset={<PortraitIsland />}
          rendered={<RenderedPane />}
        />
      </div>
    </section>
  )
}
