/**
 * §4.4 About — raw markdown source pane (desktop cols 1–5).
 * A decorative mirror of the rendered pane: aria-hidden, syntax-tinted
 * (headings electron, bold signal, inline code electron), hard-wrapped at
 * render with line numbers. Rows carry data-line ids shared with the rendered
 * blocks so the wormhole (Wormhole.client.tsx) can map render → source.
 * The real copy lives in the rendered pane; this pane is garnish. RSC only.
 */

interface Seg {
  text: string
  cls?: string
}

interface Word {
  text: string
  cls?: string
}

interface MdBlock {
  /** Shared wormhole id (data-line); null for chrome/blank lines. */
  id: string | null
  text: string
  kind?: 'heading' | 'quote'
}

interface Row {
  id: string | null
  prefix?: string
  words: Word[]
}

const WRAP_WIDTH = 46

/** Markdown mirror of the CONTENT_FINAL About copy rendered in the right pane. */
const MD_BLOCKS: MdBlock[] = [
  { id: null, text: '# README.md', kind: 'heading' },
  { id: null, text: '' },
  {
    id: 'quote',
    text: '*"I build software the way good code reads: clear, intentional, and built to last."*',
    kind: 'quote',
  },
  { id: null, text: '' },
  {
    id: 'p1',
    text: "I'm a software engineer in Boston, finishing my MS in Computer Science at Northeastern and joining **Amazon Web Services** as a Software Development Engineer in January 2027.",
  },
  { id: null, text: '' },
  {
    id: 'p2',
    text: 'Last summer at AWS I built a serverless system that captures visual evidence for cloud-security workflows — Java, Python, Lambda, and infrastructure as code, tested to **100% coverage** against a live AWS environment. Before grad school I spent three years at Schneider Electric shipping applications used by **10,000+ employees** and earning the SURGE Award.',
  },
  { id: null, text: '' },
  {
    id: 'p3',
    text: 'My ticket-assignment system Ticket-Forge took **3rd place at the Google MLOps Project Expo**; my research on medical-sample allocation is published with **IEEE**; and as a teaching assistant I mentored **300+ graduate students** in software design. I like taking systems from prototype to production — and proving they work.',
  },
  { id: null, text: '' },
  {
    id: 'stats',
    text: '`next: AWS · Jan 2027` · `users_served: 10k+` · `students_taught: 300+`',
  },
  { id: null, text: '' },
  // §2.1 wormhole line for the Decompiled Portrait (asset pane below this
  // pane on desktop; the frame carries data-line="photo").
  { id: 'photo', text: '![darshan](./darshan.webp)' },
]

/** Split a markdown line into styled segments: **bold** signal, `code` and
 *  `![image](url)` electron. */
function tokenizeInline(text: string): Seg[] {
  const segs: Seg[] = []
  const re = /(\*\*[^*]+\*\*|`[^`]+`|!\[[^\]]*\]\([^)]*\))/g
  let last = 0
  for (const m of text.matchAll(re)) {
    const index = m.index ?? 0
    if (index > last) segs.push({ text: text.slice(last, index) })
    const token = m[0]
    segs.push({ text: token, cls: token.startsWith('**') ? 'text-signal' : 'text-electron' })
    last = index + token.length
  }
  if (last < text.length) segs.push({ text: text.slice(last) })
  return segs
}

function toWords(segs: Seg[]): Word[] {
  const words: Word[] = []
  for (const seg of segs) {
    for (const w of seg.text.split(' ')) {
      if (w !== '') words.push({ text: w, cls: seg.cls })
    }
  }
  return words
}

function wrapWords(words: Word[], width: number): Word[][] {
  const lines: Word[][] = []
  let cur: Word[] = []
  let len = 0
  for (const w of words) {
    const add = w.text.length + (cur.length > 0 ? 1 : 0)
    if (len + add > width && cur.length > 0) {
      lines.push(cur)
      cur = [w]
      len = w.text.length
    } else {
      cur.push(w)
      len += add
    }
  }
  if (cur.length > 0) lines.push(cur)
  return lines.length > 0 ? lines : [[]]
}

function buildRows(): Row[] {
  const rows: Row[] = []
  for (const block of MD_BLOCKS) {
    if (block.text === '') {
      rows.push({ id: null, words: [] })
      continue
    }
    if (block.kind === 'heading') {
      rows.push({ id: block.id, words: [{ text: block.text, cls: 'text-electron' }] })
      continue
    }
    const words = toWords(tokenizeInline(block.text))
    const width = block.kind === 'quote' ? WRAP_WIDTH - 2 : WRAP_WIDTH
    for (const line of wrapWords(words, width)) {
      rows.push({
        id: block.id,
        prefix: block.kind === 'quote' ? '> ' : undefined,
        words: line,
      })
    }
  }
  return rows
}

const ROWS = buildRows()

export default function SourcePane() {
  return (
    <div aria-hidden="true" className="bg-panel hairline" data-component="SourcePane">
      <div className="border-b border-hairline px-4 py-2">
        <span className="type-label-xs text-tertiary">about.md — source</span>
      </div>
      <div className="type-code overflow-x-hidden py-4 text-secondary">
        {ROWS.map((row, i) => (
          <div
            key={i}
            {...(row.id !== null ? { 'data-line': row.id } : {})}
            className="flex gap-3 border-l-2 px-3 transition-colors"
            style={{
              borderLeftColor: 'transparent',
              transitionDuration: 'var(--dur-micro)',
              transitionTimingFunction: 'var(--ease-swift)',
            }}
          >
            <span className="w-5 shrink-0 select-none text-right text-tertiary">{i + 1}</span>
            <span className="min-w-0">
              {row.prefix !== undefined ? <span className="text-tertiary">{row.prefix}</span> : null}
              {row.words.map((w, j) => (
                <span key={j} className={w.cls}>
                  {j > 0 ? ' ' : ''}
                  {w.text}
                </span>
              ))}
              {i === ROWS.length - 1 ? <span className="caret" aria-hidden="true" /> : null}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
