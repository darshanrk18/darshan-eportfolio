/**
 * v3 Skills section copy — the visitor-language strings the S3/P3 frames
 * introduced (titles, ledes, control labels, a11y names). Chrome copy, not
 * factual claims: every fact on the page still comes from lib/data.
 */

export const SKILLS_COPY = {
  kicker: 'Skills',
  title: 'Instruments',
  chapter: 'CH. II',
  printTitle: 'The Toolkit',
  lede: 'The tools I build with, arranged as the system they make. Choose any one to see the work behind it.',
  /** P3 narrator caption pinned to the schematic. */
  printCaption: 'Every tool, wired the way a real app runs.',
  diagramLabel: 'Skills, drawn as a system',
  lightUp: 'Light up the toolkit',
  /** One polite announcement when the light-up sequence lands. */
  lightUpDone: 'The toolkit is lit — Python is selected.',
  inspectorPrompt: 'Choose a tool to see where I’ve used it.',
  /** The close-up's accessible name while nothing is chosen. */
  inspectorLabel: 'Tool close-up',
  inspectorClose: 'Close',
  /** P3 close-up section label. */
  printWhere: 'Where he used it',
  usageTitle: 'Where I’ve used them',
  printUsageTitle: 'Where each tool was used',
  printUsageLede:
    'Each job and project, with the tools it put to work. Pick a tool above and it lights up here.',
  usageExperience: 'Experience',
  usageProjects: 'Projects',
  coreStack: 'Core stack',
  languages: 'Languages',
  tileName: (label: string) => `${label} — where I’ve used it`,
  inspectorName: (label: string) => `${label} — where I’ve used it`,
  rowName: (place: string) => `${place}: light its tools in the diagram`,
  rowTools: (place: string, tools: readonly string[]) => `${place}: ${tools.join(', ')}`,
} as const

/** The skill shown at rest (S3: Python is the initial selection). */
export const DEFAULT_SKILL_ID = 'python'
