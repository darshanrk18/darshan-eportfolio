'use client'

/**
 * "See which skills each job used" — the v3 name of the v2 git-blame
 * cross-highlight (S5 §2 C6 "Skills-per-job panel" / P5 §2 B4c).
 *
 * The panel: the switch (SCREEN: a champagne pill + the label; PRINT:
 * "Highlight tools in the text" with OFF / ON segments), the three job tabs
 * (PRINT), and — while the switch is on — the chosen job's name and its
 * verified skill tiles (jobSkills from ./blame: skillsUsedAt(place), so the
 * sheet can never list an unverified tool). Off: a one-line prompt, with a
 * touch wording ("tap a job" — a touch lands as pointerover + focus on the
 * entry, so a tap picks it) beside the mouse one (InputWords).
 *
 * While on, ONE delegated listener pair on the graph root ([data-dag-root],
 * the RSC career graph) turns hover / focus over a job entry into the chosen
 * job ([data-focus] on that entry: the focus card, the champagne node, the
 * PRINT red panel shadow + leader) and hover / focus over a bullet row into
 * store.setFocusedSkills(that bullet's ids) — the Skills diagram marks those
 * tiles. The bullet marks (<mark data-skill>, RSC) light up through CSS keyed
 * off [data-blame-on] + [data-focus]; hovering a tile sets [data-hot] on the
 * matching marks (the solid underline).
 *
 * Guide (§2.6): dispatches `signal:guide-tried` { id: 'skills-per-job' }
 * when the switch turns on, by any path. `signal:blame-on` (./events, detail
 * { job? }) turns it on from outside (the guide's "Try it", C5): the
 * always-mounted SkillsPerJobIsland queues it and passes it in as `request`,
 * so it lands even when dispatched before this chunk mounted. The switch
 * also carries [data-blame-toggle] for a plain DOM click.
 *
 * Renders in every motion mode (the v2 island returned null under reduced
 * motion; the v3 switch must work statically).
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import InputWords from '@/components/chrome/InputWords'
import EdLogo from '@/components/skills/EdLogo'
import { dispatchWhenMounted, markGuideTried } from '@/components/skills/guide'
import { scrollToAnchor, SIGNAL_EVENTS } from '@/lib/commands/context'
import { commits, jobIds } from '@/lib/data/experience'
import { useSignalStore } from '@/lib/state/store'
import { isBlameJobId, jobSkills, type BlameJobId } from './blame'
import { XP_COPY } from './copy'
import type { BlameRequest } from './events'

/** The job the panel shows first (both frames: Schneider Electric). */
const DEFAULT_JOB: BlameJobId = 'schneider'

/* The career graph lives in the Experience section that hosts this panel
   (the panel is itself a <section>, so the lookup climbs to the section
   root by its data-component, never by tag). */
function graphRootOf(el: HTMLElement | null): HTMLElement | null {
  return (
    el?.closest('[data-component="Experience"]')?.querySelector<HTMLElement>('[data-dag-root]') ??
    null
  )
}

export interface SkillsPerJobProps {
  /** The latest `signal:blame-on` the island wrapper heard (null = none yet). */
  request: BlameRequest | null
}

export default function SkillsPerJob({ request }: SkillsPerJobProps) {
  const rootRef = useRef<HTMLElement | null>(null)
  const [on, setOn] = useState(false)
  const [job, setJob] = useState<BlameJobId>(DEFAULT_JOB)
  const [hotSkill, setHotSkill] = useState<string | null>(null)
  const wasOnRef = useRef(false)

  /* The guide's completion: the switch turning on, by any path. */
  useEffect(() => {
    if (on && !wasOnRef.current) markGuideTried('skills-per-job')
    wasOnRef.current = on
  }, [on])

  /* `signal:blame-on` (queued by the wrapper): pick the job, turn the switch on. */
  useEffect(() => {
    if (!request) return
    if (request.job && isBlameJobId(request.job)) setJob(request.job)
    setOn(true)
  }, [request])

  /* While on: the graph root is armed and hover / focus picks the job and
     narrows the store focus to a bullet's skills. */
  useEffect(() => {
    const root = graphRootOf(rootRef.current)
    if (!root) return
    if (!on) {
      root.removeAttribute('data-blame-on')
      return
    }
    root.setAttribute('data-blame-on', '1')
    const entries = Array.from(root.querySelectorAll<HTMLElement>('[data-job]')).filter((el) =>
      isBlameJobId(el.dataset.job ?? '')
    )
    const bullets = Array.from(root.querySelectorAll<HTMLElement>('[data-skills]'))
    entries.forEach((el) => el.setAttribute('tabindex', '0'))
    bullets.forEach((el) => el.setAttribute('tabindex', '0'))

    const setFocused = (ids: string[]) => useSignalStore.getState().setFocusedSkills(ids)
    const entryFrom = (t: EventTarget | null) =>
      t instanceof Element ? t.closest<HTMLElement>('[data-job]') : null
    const bulletFrom = (t: EventTarget | null) =>
      t instanceof Element ? t.closest<HTMLElement>('[data-skills]') : null

    const enter = (target: EventTarget | null) => {
      const entry = entryFrom(target)
      const id = entry?.dataset.job
      if (id && isBlameJobId(id)) setJob(id)
      const bullet = bulletFrom(target)
      if (bullet) setFocused((bullet.dataset.skills ?? '').split(',').filter(Boolean))
    }
    const leave = (target: EventTarget | null, related: EventTarget | null) => {
      const bullet = bulletFrom(target)
      if (!bullet) return
      if (related instanceof Node && bullet.contains(related)) return
      setFocused([])
    }
    const onPointerOver = (e: PointerEvent) => enter(e.target)
    const onPointerOut = (e: PointerEvent) => leave(e.target, e.relatedTarget)
    const onFocusIn = (e: FocusEvent) => enter(e.target)
    const onFocusOut = (e: FocusEvent) => leave(e.target, e.relatedTarget)

    root.addEventListener('pointerover', onPointerOver)
    root.addEventListener('pointerout', onPointerOut)
    root.addEventListener('focusin', onFocusIn)
    root.addEventListener('focusout', onFocusOut)
    return () => {
      root.removeEventListener('pointerover', onPointerOver)
      root.removeEventListener('pointerout', onPointerOut)
      root.removeEventListener('focusin', onFocusIn)
      root.removeEventListener('focusout', onFocusOut)
      entries.forEach((el) => el.removeAttribute('tabindex'))
      bullets.forEach((el) => el.removeAttribute('tabindex'))
      root.removeAttribute('data-blame-on')
      setFocused([])
    }
  }, [on])

  /* The chosen job on the graph: [data-focus] on its entry. */
  useEffect(() => {
    const root = graphRootOf(rootRef.current)
    if (!root) return
    root.querySelectorAll<HTMLElement>('[data-job]').forEach((el) => {
      if (on && el.dataset.job === job) el.setAttribute('data-focus', '1')
      else el.removeAttribute('data-focus')
    })
  }, [on, job])

  /* Hovering a tile underlines the matching words in the bullets. */
  useEffect(() => {
    const root = graphRootOf(rootRef.current)
    if (!root) return
    root.querySelectorAll<HTMLElement>('mark[data-skill]').forEach((mark) => {
      if (hotSkill && mark.dataset.skill === hotSkill) mark.setAttribute('data-hot', '1')
      else mark.removeAttribute('data-hot')
    })
  }, [hotSkill])

  /* A tile opens that skill in the toolkit (scroll first, then the event,
     retried until the Skills island has mounted). */
  const openInToolkit = useCallback((id: string) => {
    useSignalStore.getState().setFocusedSkills([id])
    scrollToAnchor('#skills')
    dispatchWhenMounted(SIGNAL_EVENTS.inspectSkill, { id }, '[data-component="SystemDiagram"]')
  }, [])

  const entry = commits.find((c) => c.id === job)
  const skills = jobSkills(job)

  return (
    <section
      ref={rootRef}
      className="xp-panel ed-panel"
      data-component="SkillsPerJob"
      data-island="client"
      data-on={on ? 'true' : undefined}
      aria-label={XP_COPY.panelTitle}
    >
      <h3 className="xp-panel-title ed-print-only">{XP_COPY.panelTitle}</h3>

      <button
        type="button"
        className="xp-switch"
        aria-pressed={on}
        data-blame-toggle
        data-guide-anchor="skills-per-job"
        onClick={() => setOn((v) => !v)}
      >
        <span aria-hidden="true" className="xp-switch-pill ed-screen-only" />
        <span className="xp-switch-label ed-screen-only">{XP_COPY.panelTitle}</span>
        <span className="xp-switch-label ed-print-only">{XP_COPY.printSwitchLabel}</span>
        <span aria-hidden="true" className="xp-switch-seg ed-print-only">
          <span data-on={on ? undefined : 'true'}>{XP_COPY.switchOff}</span>
          <span data-on={on ? 'true' : undefined}>{XP_COPY.switchOn}</span>
        </span>
      </button>

      <div className="xp-tabs ed-print-only" role="group" aria-label={XP_COPY.tabsLabel}>
        {jobIds.map((id) => {
          const c = commits.find((x) => x.id === id)
          if (!c) return null
          return (
            <button
              key={id}
              type="button"
              className="xp-tab"
              aria-pressed={on && id === job}
              onClick={() => {
                setJob(id)
                setOn(true)
              }}
              onPointerEnter={() => {
                if (on) setJob(id)
              }}
            >
              {c.companyShort}
            </button>
          )
        })}
      </div>

      {on && entry ? (
        <div className="xp-sheet" role="group" aria-label={XP_COPY.sheetLabel(entry.company)}>
          <p className="xp-sheet-job ed-screen-only">{entry.company}</p>
          <ul className="xp-tiles">
            {skills.map((skill) => (
              <li key={skill.id}>
                <button
                  type="button"
                  className="xp-tile"
                  data-skill-id={skill.id}
                  data-hot={hotSkill === skill.id ? 'true' : undefined}
                  aria-label={XP_COPY.tileName(skill.label)}
                  onPointerEnter={() => setHotSkill(skill.id)}
                  onPointerLeave={() => setHotSkill(null)}
                  onFocus={() => setHotSkill(skill.id)}
                  onBlur={() => setHotSkill(null)}
                  onClick={() => openInToolkit(skill.id)}
                >
                  <EdLogo id={skill.id} size={17} />
                  <span>{skill.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="xp-prompt">
          <span className="ed-screen-only">
            <InputWords mouse={XP_COPY.prompt.screen} touch={XP_COPY.promptTouch.screen} />
          </span>
          <span className="ed-print-only">
            <InputWords mouse={XP_COPY.prompt.print} touch={XP_COPY.promptTouch.print} />
          </span>
        </p>
      )}
    </section>
  )
}
