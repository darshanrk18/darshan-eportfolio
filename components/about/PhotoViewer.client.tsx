'use client'

/**
 * The S2 photo viewer (lazy chunk, opened by Filmstrip.client): a native
 * <dialog> shown modally — focus trap, Esc and the backdrop come for free —
 * with the large -41 photograph, its caption, previous / next and a close
 * control. ← → move through the strip. Skin: about.css (`.ab-viewer*`).
 */

import { useEffect, useRef, type KeyboardEvent } from 'react'
import type { Photo } from '@/lib/data/photos'

export interface PhotoViewerProps {
  photos: readonly Photo[]
  index: number
  closeLabel: string
  onIndex: (i: number) => void
  onClose: () => void
}

export default function PhotoViewer({ photos, index, closeLabel, onIndex, onClose }: PhotoViewerProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const photo = photos[index] ?? photos[0]
  const count = photos.length

  useEffect(() => {
    const el = ref.current
    if (!el || el.open) return
    try {
      el.showModal()
    } catch {
      el.setAttribute('open', '')
    }
  }, [])

  const prev = () => onIndex((index - 1 + count) % count)
  const next = () => onIndex((index + 1) % count)

  const onKeyDown = (e: KeyboardEvent<HTMLDialogElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      prev()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      next()
    }
  }

  if (!photo) return null

  return (
    <dialog
      ref={ref}
      className="ab-viewer"
      aria-label={photo.alt}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onKeyDown={onKeyDown}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      data-component="PhotoViewer"
      data-island="client"
    >
      <figure className="ab-viewer-fig">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={photo.key}
          src={photo.screen}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          decoding="async"
          className="ab-viewer-img"
        />
        <figcaption className="ab-viewer-cap">{photo.caption}</figcaption>
      </figure>
      <div className="ab-viewer-bar">
        <button type="button" className="ab-viewer-btn" onClick={prev} aria-label="Previous photo">
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
            <path d="M14 5H2M6 1 2 5l4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="ab-viewer-count" aria-live="polite">
          {index + 1} of {count}
        </span>
        <button type="button" className="ab-viewer-btn" onClick={next} aria-label="Next photo">
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
            <path d="M0 5h12M8 1l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button type="button" className="ab-viewer-btn ab-viewer-close" onClick={onClose} autoFocus>
          {closeLabel}
        </button>
      </div>
    </dialog>
  )
}
