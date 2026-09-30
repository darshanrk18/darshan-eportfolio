'use client'

/**
 * ⌘K palette dialog (spec §5.2) — cmdk inside its Radix dialog, code-split
 * behind components/palette/CommandPalette.tsx.
 *
 * Groups (registry order): Navigate / Actions / Projects / Skills / Fun.
 * Skills is nested: selecting `Skills…` (or typing `skills > docker`) scopes
 * the list to the skill nodes; choosing one scrolls to §Skills and opens
 * the inspector via ctx.focusSkill. Every action runs through the shared
 * command registry — this file adds zero behavior of its own.
 *
 * While a query is typed the rows are ONE ranked list ("Results"): cmdk
 * sorts items inside a group by score but cannot reorder the groups
 * themselves (its group lookup misses), so with groups the first row — and
 * Enter — would be the best match of the FIRST group, not of the list
 * (typing `choose` selected "Go to Contact" over "Choose your edition").
 *
 * Motion: scale 0.98→1, 150ms swift (globals.css collapses it under
 * html[data-motion='reduced']). ARIA + focus trap come from cmdk's dialog.
 */

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Command, CommandDialog, defaultFilter } from 'cmdk'
import { createCommandCtx, getCurrentEdition } from '@/lib/commands/context'
import { runGuideAction } from '@/lib/guide/actions'
import {
  GUIDE_PALETTE_PREFIX,
  guideLabel,
  guideWhere,
  markTried,
  nextUntried,
} from '@/lib/guide/guide'
import {
  GROUP_LABELS,
  GROUP_ORDER,
  commandsForSurface,
  getCommand,
  type Command as CommandEntry,
  type CommandGroup,
  type SectionAnchor,
} from '@/lib/commands/registry'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'
import { useSignalStore } from '@/lib/state/store'
import { trackPaletteAction } from '@/lib/utils/analytics'

interface PaletteDialogProps {
  onClose: () => void
}

/** `skills > <query>` — the typed route into the nested skills page. */
const SKILLS_PREFIX = /^skills\s*>\s*(.*)$/i

/**
 * v2 §10.2 — the narrator. The palette's first group ("Next") suggests the
 * one or two most useful moves for the section currently in view (store
 * `activeSection`, written by the Navbar scrollspy). Every row maps a
 * suggestion label to an EXISTING registry command id — zero new behavior.
 * v3: labels in visitor language (clutter law — no file names or routes).
 */
type NarratorKey = SectionAnchor | 'hero'
const NARRATOR_MAP: Record<NarratorKey, ReadonlyArray<{ label: string; id: string }>> = {
  hero: [{ label: 'Read the story ↓', id: 'go-about' }],
  '#about': [{ label: 'See the toolkit ↓', id: 'go-skills' }],
  '#skills': [{ label: 'Play Connect Four against the engine', id: 'play-connect-four' }],
  '#projects': [{ label: 'On to the experience ↓', id: 'go-experience' }],
  '#experience': [
    { label: 'Copy email', id: 'copy-email' },
    { label: 'or download the résumé', id: 'download-resume' },
  ],
  '#contact': [{ label: 'Open the résumé page', id: 'go-cv' }],
}

/** Resolve the active section (footer counts as #contact) to narrator rows. */
function narratorRowsFor(
  activeSection: SectionAnchor | 'hero' | 'footer' | null
): Array<{ label: string; cmd: CommandEntry }> {
  const key: NarratorKey =
    activeSection === null || activeSection === 'hero'
      ? 'hero'
      : activeSection === 'footer'
        ? '#contact'
        : activeSection
  const rows: Array<{ label: string; cmd: CommandEntry }> = []
  for (const { label, id } of NARRATOR_MAP[key]) {
    const cmd = getCommand(id)
    if (cmd) rows.push({ label, cmd })
  }
  return rows
}

/**
 * cmdk filter: strip the `skills >` prefix so the remainder scores against
 * skill nodes; empty queries show everything (cmdk group logic hides the rest).
 *
 * Ranking: a literal hit always outranks a fuzzy one, so the row whose title
 * or keyword actually contains what was typed is the one Enter runs (typing
 * `choose` selects "Choose your edition", not a row that merely has those
 * letters scattered through its keywords). Ties fall back to cmdk's score.
 */
export function paletteFilter(value: string, search: string, keywords?: string[]): number {
  const q = (SKILLS_PREFIX.exec(search)?.[1] ?? search).trim()
  if (q === '') return 1
  const fuzzy = defaultFilter(value, q, keywords)
  const needle = q.toLowerCase()
  const hay = [value, ...(keywords ?? [])].map((s) => s.toLowerCase())
  const bonus = hay.some((s) => s === needle)
    ? 3
    : hay.some((s) => s.split(/\s+/).some((w) => w.startsWith(needle)))
      ? 2
      : hay.some((s) => s.includes(needle))
        ? 1
        : 0
  return bonus > 0 ? bonus + fuzzy : fuzzy
}

export default function PaletteDialog({ onClose }: PaletteDialogProps) {
  const router = useRouter()
  const reduced = usePrefersReducedMotion()
  const ctx = useMemo(() => createCommandCtx(router), [router])

  const [search, setSearch] = useState('')
  const [page, setPage] = useState<'root' | 'skills'>('root')

  const skillsMode = page === 'skills' || SKILLS_PREFIX.test(search)
  const searching = (SKILLS_PREFIX.exec(search)?.[1] ?? search).trim() !== ''

  // v2 §10.2 — narrator rows for the section currently in view.
  const activeSection = useSignalStore((s) => s.activeSection)
  const narratorRows = useMemo(() => narratorRowsFor(activeSection), [activeSection])

  // v3 §2.6 — the guide's next untried item heads the Next group ("Try:
  // Light up the toolkit") and runs the same action as the guide's "Try it".
  // The palette itself is item 1, being tried right now, so the row always
  // suggests the one after it.
  const guideTried = useSignalStore((s) => s.guideTried)
  const storeEdition = useSignalStore((s) => s.edition)
  const edition = storeEdition ?? getCurrentEdition()
  const guideNext = useMemo(() => nextUntried(markTried(guideTried, 'go-anywhere')), [guideTried])

  // Palette-surface commands, grouped. Reduced-motion state decides which of
  // the two animation toggles is offered (§5.2 "Disable animation").
  const grouped = useMemo(() => {
    const map = new Map<CommandGroup, CommandEntry[]>()
    for (const cmd of commandsForSurface('palette')) {
      if (cmd.id === 'disable-animation' && reduced) continue
      if (cmd.id === 'enable-animation' && !reduced) continue
      const list = map.get(cmd.group)
      if (list) list.push(cmd)
      else map.set(cmd.group, [cmd])
    }
    return map
  }, [reduced])

  const skillCommands = grouped.get('skill') ?? []

  const runCommand = (cmd: CommandEntry) => {
    onClose()
    trackPaletteAction(cmd.id)
    void cmd.run(ctx)
  }

  const onDialogKeyDown = (e: React.KeyboardEvent) => {
    if (page !== 'skills') return
    if (e.key === 'Escape') {
      // First Escape leaves the skills page; the next one closes the dialog.
      e.preventDefault()
      e.stopPropagation()
      setPage('root')
      setSearch('')
    } else if (e.key === 'Backspace' && search === '') {
      e.preventDefault()
      setPage('root')
    }
  }

  const renderItem = (cmd: CommandEntry) => (
    <Command.Item
      key={cmd.id}
      value={cmd.id}
      keywords={[cmd.title, ...(cmd.aliases ?? []), ...cmd.keywords]}
      onSelect={() => runCommand(cmd)}
      className="sig-palette-item type-code"
    >
      <span>{cmd.title}</span>
      {cmd.kbd ? <kbd className="sig-palette-kbd type-label-sm">{cmd.kbd}</kbd> : null}
    </Command.Item>
  )

  const groupHeading = (group: CommandGroup) => (
    <span className="type-label-xs">{GROUP_LABELS[group]}</span>
  )

  /* v3 §2.6 — the guide's next untried item ("Try: Light up the toolkit"). */
  const renderGuideNext = () =>
    guideNext === null ? null : (
      <Command.Item
        key={`next-guide-${guideNext}`}
        value={`next-guide-${guideNext}`}
        keywords={['try', 'next', 'guide', guideLabel(guideNext, edition)]}
        onSelect={() => {
          onClose()
          trackPaletteAction(`guide-${guideNext}`)
          void runGuideAction(guideNext, ctx)
        }}
        className="sig-palette-item type-code"
      >
        <span>
          {GUIDE_PALETTE_PREFIX}
          {guideLabel(guideNext, edition)}
        </span>
        <span className="sig-palette-where type-label-sm">
          {guideWhere(guideNext, edition)}
          <kbd className="sig-palette-kbd">↵</kbd>
        </span>
      </Command.Item>
    )

  /* The nested skills page's entry row. */
  const renderSkillsMenu = () => (
    <Command.Item
      key="skills-menu"
      value="skills-menu"
      keywords={['skills', 'skill', 'toolchain']}
      onSelect={() => {
        setPage('skills')
        setSearch('')
      }}
      className="sig-palette-item type-code"
    >
      <span>Skills…</span>
      <span className="sig-palette-kbd type-label-sm">&gt;</span>
    </Command.Item>
  )

  /* v2 §10.2 — a narrator row for the section in view. */
  const renderNarrator = ({ label, cmd }: { label: string; cmd: CommandEntry }) => (
    <Command.Item
      key={`next-${cmd.id}`}
      value={`next-${cmd.id}`}
      keywords={[label, cmd.title, ...(cmd.aliases ?? [])]}
      onSelect={() => runCommand(cmd)}
      className="sig-palette-item type-code"
    >
      <span>{label}</span>
    </Command.Item>
  )

  return (
    <>
      <style>{paletteCss}</style>
      <CommandDialog
        open
        onOpenChange={(o) => {
          if (!o) onClose()
        }}
        label="Command palette"
        overlayClassName="sig-palette-overlay"
        contentClassName="sig-palette-content"
        {...{ 'data-component': 'CommandPalette', 'data-island': 'client' }}
        filter={paletteFilter}
        loop
        onKeyDown={onDialogKeyDown}
      >
        {page === 'skills' ? (
          <div className="sig-palette-crumb-row" aria-hidden="true">
            <span className="sig-palette-crumb type-label-sm">skills &gt;</span>
          </div>
        ) : null}
        <Command.Input
          value={search}
          onValueChange={setSearch}
          autoFocus
          placeholder={page === 'skills' ? 'Search the skills…' : 'Type a page, or a thing to try'}
          className="sig-palette-input type-code"
        />
        <Command.List className="sig-palette-list">
          <Command.Empty className="sig-palette-empty type-code">no results</Command.Empty>

          {skillsMode ? (
            <Command.Group heading={groupHeading('skill')} className="sig-palette-group">
              {skillCommands.map(renderItem)}
            </Command.Group>
          ) : searching ? (
            <Command.Group
              heading={<span className="type-label-xs">Results</span>}
              className="sig-palette-group"
            >
              {guideNext !== null ? renderGuideNext() : null}
              {narratorRows.map(renderNarrator)}
              {GROUP_ORDER.flatMap((group) => grouped.get(group) ?? []).map(renderItem)}
              {renderSkillsMenu()}
            </Command.Group>
          ) : (
            <>
              {/* v2 §10.2 — the narrator: first group, above Navigate.
                  v3 §2.6 — its first row is the guide's next untried item. */}
              {guideNext !== null || narratorRows.length > 0 ? (
                <Command.Group
                  heading={<span className="type-label-xs">Next</span>}
                  className="sig-palette-group"
                >
                  {guideNext !== null ? renderGuideNext() : null}
                  {narratorRows.map(renderNarrator)}
                </Command.Group>
              ) : null}
              {GROUP_ORDER.map((group) => {
                const cmds = grouped.get(group) ?? []
                if (group === 'skill') {
                  return (
                    <Command.Group
                      key={group}
                      heading={groupHeading(group)}
                      className="sig-palette-group"
                    >
                      {renderSkillsMenu()}
                    </Command.Group>
                  )
                }
                if (cmds.length === 0) return null
                return (
                  <Command.Group
                    key={group}
                    heading={groupHeading(group)}
                    className="sig-palette-group"
                  >
                    {cmds.map(renderItem)}
                  </Command.Group>
                )
              })}
            </>
          )}
        </Command.List>
      </CommandDialog>
    </>
  )
}

/**
 * Palette skin — every color/easing/shadow references app/globals.css tokens.
 * Kept beside the component so the lazy chunk carries its own styles.
 */
const paletteCss = `
.sig-palette-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-palette);
  background: var(--bg-overlay);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}
.sig-palette-content {
  position: fixed;
  left: 50%;
  top: 16vh;
  transform: translateX(-50%);
  width: min(620px, calc(100vw - 32px));
  z-index: var(--z-palette);
  background: var(--bg-panel);
  border: 1px solid var(--border-hairline);
  border-radius: 8px;
  box-shadow: var(--elev-window);
  overflow: hidden;
  animation: sig-palette-pop 150ms var(--ease-swift);
}
@keyframes sig-palette-pop {
  from {
    opacity: 0;
    transform: translateX(-50%) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) scale(1);
  }
}
.sig-palette-crumb-row {
  padding: 10px 12px 0;
}
.sig-palette-crumb {
  display: inline-flex;
  padding: 2px 8px;
  border: 1px solid var(--border-hairline);
  border-radius: 6px;
  color: var(--accent-signal);
  background: var(--accent-signal-dim);
}
.sig-palette-input {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-hairline);
}
.sig-palette-input::placeholder {
  color: var(--text-secondary);
}
.sig-palette-list {
  max-height: min(420px, 60vh);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 8px;
  scroll-padding-block: 8px;
}
.sig-palette-group [cmdk-group-heading] {
  padding: 10px 8px 6px;
  color: var(--text-secondary);
}
.sig-palette-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 6px;
  border-left: 2px solid transparent;
  color: var(--text-secondary);
  cursor: pointer;
}
.sig-palette-item[data-selected='true'] {
  background: var(--accent-signal-dim);
  border-left-color: var(--accent-signal);
  color: var(--text-primary);
}
.sig-palette-kbd {
  padding: 1px 6px;
  border: 1px solid var(--border-hairline);
  border-radius: 6px;
  color: var(--text-secondary);
  background: var(--bg-raised);
}
/* v3 §2.6 — the guide's Next row: where the feature lives + the enter keycap. */
.sig-palette-where {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--text-tertiary);
  white-space: nowrap;
}
.sig-palette-empty {
  padding: 24px 16px;
  text-align: center;
  color: var(--text-secondary);
}
`
