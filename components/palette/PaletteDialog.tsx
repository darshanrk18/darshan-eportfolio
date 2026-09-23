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
 * Motion: scale 0.98→1, 150ms swift (globals.css collapses it under
 * html[data-motion='reduced']). ARIA + focus trap come from cmdk's dialog.
 */

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Command, CommandDialog, defaultFilter } from 'cmdk'
import { createCommandCtx } from '@/lib/commands/context'
import {
  GROUP_LABELS,
  GROUP_ORDER,
  commandsForSurface,
  type Command as CommandEntry,
  type CommandGroup,
} from '@/lib/commands/registry'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'
import { trackPaletteAction } from '@/lib/utils/analytics'

interface PaletteDialogProps {
  onClose: () => void
}

/** `skills > <query>` — the typed route into the nested skills page. */
const SKILLS_PREFIX = /^skills\s*>\s*(.*)$/i

/**
 * cmdk filter: strip the `skills >` prefix so the remainder scores against
 * skill nodes; empty queries show everything (cmdk group logic hides the rest).
 */
function paletteFilter(value: string, search: string, keywords?: string[]): number {
  const q = (SKILLS_PREFIX.exec(search)?.[1] ?? search).trim()
  if (q === '') return 1
  return defaultFilter(value, q, keywords)
}

export default function PaletteDialog({ onClose }: PaletteDialogProps) {
  const router = useRouter()
  const reduced = usePrefersReducedMotion()
  const ctx = useMemo(() => createCommandCtx(router), [router])

  const [search, setSearch] = useState('')
  const [page, setPage] = useState<'root' | 'skills'>('root')

  const skillsMode = page === 'skills' || SKILLS_PREFIX.test(search)
  const searching = (SKILLS_PREFIX.exec(search)?.[1] ?? search).trim() !== ''

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
          placeholder={page === 'skills' ? 'search skills…' : 'type a command or search…'}
          className="sig-palette-input type-code"
        />
        <Command.List className="sig-palette-list">
          <Command.Empty className="sig-palette-empty type-code">no results</Command.Empty>

          {skillsMode ? (
            <Command.Group heading={groupHeading('skill')} className="sig-palette-group">
              {skillCommands.map(renderItem)}
            </Command.Group>
          ) : (
            GROUP_ORDER.map((group) => {
              const cmds = grouped.get(group) ?? []
              if (group === 'skill') {
                return (
                  <Command.Group
                    key={group}
                    heading={groupHeading(group)}
                    className="sig-palette-group"
                  >
                    <Command.Item
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
                    {searching ? cmds.map(renderItem) : null}
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
            })
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
.sig-palette-empty {
  padding: 24px 16px;
  text-align: center;
  color: var(--text-secondary);
}
`
