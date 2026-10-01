/**
 * v3 Experience section copy — the visitor-language strings the S5/P5 frames
 * introduced (titles, control labels, prompts, a11y names, the PRINT plate
 * captions). Chrome copy, not factual claims: every fact on the page still
 * comes from lib/data.
 */

import type { BlameJobId } from './blame'
import type { PhotoKey } from '@/lib/data/photos'

export const XP_COPY = {
  kicker: 'Experience',
  title: 'Credits',
  chapter: 'CH. IV',
  printTitle: 'The Field Years',
  educationLabel: 'Education',
  readPaper: 'Read the paper',
  copyCitation: 'Copy the citation',
  copied: 'Copied',
  /** P5 NEXT ISSUE box. */
  nextIssue: ['Next', 'Issue'] as const,
  starts: 'Starts',
  outcomeTag: 'Outcome',
  /** The switch (S5: the panel header; P5: "Highlight tools in the text"). */
  panelTitle: 'See which skills each job used',
  printSwitchLabel: 'Highlight tools in the text',
  printSwitchName: (on: boolean) =>
    `Highlight the chosen job's tools in its text: ${on ? 'on' : 'off'}`,
  switchOff: 'Off',
  switchOn: 'On',
  /** One-line prompt while the switch is off (S5 §8; P5 coach wording). */
  prompt: { screen: 'Turn this on, then hover a job.', print: 'Switch it on, then pick a job.' },
  /** The prompt on a touch screen (lib/utils/input.ts): a tap picks the job, nothing hovers. */
  promptTouch: { screen: 'Turn this on, then tap a job.', print: 'Switch it on, then pick a job.' },
  tabsLabel: 'Pick a job',
  sheetLabel: (company: string) => `Skills used at ${company}`,
  jobName: (company: string) => `${company} — skills highlighted`,
  tileName: (label: string) => `${label} — open it in the toolkit`,
  graphLabel: 'Experience, newest first',
  asideLabel: 'Education, and the skills each job used',
} as const

/** P5 plate photos and captions per job (new copy approved in the P5 frame). */
export const PRINT_PLATES: Record<
  BlameJobId,
  { photo: PhotoKey; caption: string; tint: 'paper' | 'yellow' }
> = {
  'aws-intern': { photo: 'badge', caption: 'The badge, Boston', tint: 'paper' },
  'neu-ta': { photo: 'neu_quad', caption: 'Krentzman Quad, Boston', tint: 'paper' },
  schneider: { photo: 'schneider_office', caption: 'The office, Bengaluru', tint: 'yellow' },
}
