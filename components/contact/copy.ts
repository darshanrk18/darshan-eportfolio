/**
 * Contact copy per edition (V3_SPEC §3 Contact; frames S6 "the letter" +
 * "the console", P6 "Ch. V The Letters Page"). Visitor language only
 * (BRIEF-R2 §1): no command syntax outside the console window, no file
 * names, no pipeline words. Facts (name, email, location, links) come from
 * lib/data/profile — this module holds the labels the frames introduced.
 * Pure and node-testable.
 */

import { profile } from '@/lib/data/profile'

export const contactCopy = {
  screen: {
    kicker: 'Contact',
    /** Two lines; the break after "something" is kept (S6 §2 C2). */
    headline: ["Let's build something", 'correct and beautiful.'],
    write: 'Write to me',
    copyEmail: 'Copy email address',
    consoleTitle: 'Console',
    consoleMax: 'Open the console full screen',
    consoleRestore: 'Close the full-screen console',
    railLabel: 'Click one — or type your own',
  },
  print: {
    chapter: 'Ch. V',
    title: 'The Letters Page',
    lede: 'The inbox is open — for roles, questions, or just to say hello.',
    airmail: 'By air mail',
    /** Postmark arc: the location as the frame sets it. */
    postmark: 'BOSTON · MA',
    postmarkYear: '2026',
    to: 'To',
    addressee: profile.displayName,
    copyEmail: 'Copy the email address',
    reLabel: 'Re:',
    reGroup: 'What are you writing about?',
    subjects: [
      { value: 'role', label: 'A role' },
      { value: 'project', label: 'A project' },
      { value: 'hello', label: 'Just hello' },
    ],
    write: 'Write him',
    consoleCaption: 'Meanwhile, in the console…',
    consoleMax: 'Maximize the console',
    consoleRestore: 'Restore the console',
    railLabel: 'Try',
    colophonTitle: 'Konnur Comics',
    colophonLine: 'Written, drawn and inked by D. Konnur, 2026.',
    replay: 'Replay the intro',
    toBeContinued: 'To be continued…',
  },
  shared: {
    copied: 'Copied',
    resume: 'Résumé',
    resumeAria: 'Download résumé (PDF)',
    github: 'GitHub',
    linkedin: 'LinkedIn',
    /** The console's accessible description of the portrait it prints. */
    faceAlt: {
      screen: `${profile.displayName}, printed by the console in characters that resolve into his photograph`,
      print: profile.displayName,
    },
    /** The four readout rows (dt) beside the portrait. */
    info: [
      { key: 'name', value: profile.name },
      { key: 'role', value: profile.terminal.whoamiRole },
      { key: 'location', value: profile.location },
      { key: 'education', value: profile.terminal.whoamiEducation },
    ],
  },
} as const

/** The mailto for the primary action, with the PRINT subject when chosen. */
export function writeHref(subject?: string | null): string {
  const base = `mailto:${profile.email}`
  return subject ? `${base}?subject=${encodeURIComponent(subject)}` : base
}
