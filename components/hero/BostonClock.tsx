'use client'

/**
 * Live Boston local time — `14:32 EST` (spec §4.3 status row).
 * Renders nothing until mounted; the RSC row shows `Boston, MA` alone, so
 * there is no hydration mismatch and no layout dependence on the clock.
 */

import { useEffect, useState } from 'react'

function bostonTime(): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZoneName: 'short',
  }).formatToParts(new Date())
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  const hour = get('hour')
  const minute = get('minute')
  const zone = get('timeZoneName')
  if (!hour || !minute) return ''
  return zone ? `${hour}:${minute} ${zone}` : `${hour}:${minute}`
}

export default function BostonClock() {
  const [label, setLabel] = useState<string | null>(null)

  useEffect(() => {
    const update = () => {
      try {
        setLabel(bostonTime())
      } catch {
        setLabel(null)
      }
    }
    update()
    const id = setInterval(update, 30_000)
    return () => clearInterval(id)
  }, [])

  if (!label) return null
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>&nbsp;· {label}</span>
}
