/**
 * Contact — `./contact.sh` (spec §4.8). RSC shell: section header with the
 * serif headline, the primary action row (client island), status line, and
 * the terminal window. The window chrome + banner are server-rendered so the
 * space is reserved before the terminal island hydrates (zero CLS); a
 * `skip terminal` link precedes the window.
 */

import SectionHeader from '@/components/chrome/SectionHeader'
import ContactActions from '@/components/contact/ContactActions'
import Terminal from '@/components/contact/TerminalIsland'
import { profile } from '@/lib/data/profile'

export default function Contact() {
  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="section-pad"
      data-component="Contact"
      data-island="RSC"
      style={{ ['--vs-i' as string]: 5 }}
    >
      <div className="container-site">
        <div className="mx-auto max-w-[800px]">
          <SectionHeader
            index="05"
            name="CONTACT"
            file="contact.sh"
            headingId="contact-heading"
            headline="Let's build something correct and beautiful."
            serif
          />

          <ContactActions />

          <p className="type-label-xs text-secondary mt-6">
            {profile.location} · {profile.status} · replies fast
          </p>

          <a href="#terminal-end" className="skip-link">
            skip terminal
          </a>

          <div
            role="region"
            aria-label="Interactive terminal — decorative alternative to the links above"
            className="elev-window mt-12 min-h-80 bg-panel"
            data-component="Terminal"
          >
            <p className="type-label-sm border-b border-hairline px-4 py-2 text-secondary">
              guest@darshan: ~
            </p>
            <Terminal />
          </div>

          <div id="terminal-end" tabIndex={-1} aria-hidden="true" />
        </div>
      </div>
    </section>
  )
}
