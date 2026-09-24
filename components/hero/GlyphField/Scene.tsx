'use client'

/**
 * The WebGL scene for the Living Glyph Field (spec §5.5).
 *
 * - ONE draw call: an InstancedBufferGeometry of sprite quads + one
 *   ShaderMaterial sampling the runtime glyph atlas.
 * - No own rAF loop: `frameloop="never"` + the shared ticker driving
 *   `advance()` (spec §6.4 rule 5 / foundation §4).
 * - Cursor comes from the --mx/--my CSS vars written by CursorHalo (the one
 *   pointermove listener) — no extra listener here.
 * - TierGovernor (§8.3) samples every frame: downgrades lower instanceCount;
 *   a drop to T0 tears the island down to the static constellation.
 * - webglcontextlost ⇒ permanent teardown via onTeardown.
 */

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useThree } from '@react-three/fiber'
import { subscribeTicker } from '@/lib/motion/ticker'
import { TIER_PARTICLES, TierGovernor, type GlyphTier } from '@/lib/perf/tiers'
import { useSignalStore } from '@/lib/state/store'
import { createSeededRandom } from '@/lib/utils/seeded'
import { ATLAS_GRID, FIELD_GLYPH_COUNT, createGlyphAtlasTexture, glyphIndexOf } from './atlas'
import { glyphFragmentShader, glyphVertexShader } from './shaders'
import { DPR_CAP, LAYER_SPLIT, SPAWN_RING_SIZE, particleCount, type ActiveTier } from './tiers'

export interface GlyphSceneProps {
  /** Tier at mount; internal downgrades never exceed it (§8.3: no re-upgrade). */
  initialTier: ActiveTier
  /** First frame has rendered — parent starts the 400ms fade-in. */
  onReady: () => void
  /** Governor downgraded to a still-active tier (1–3). */
  onTierChange: (tier: GlyphTier) => void
  /** Permanent fallback to the static constellation (T0 / context lost). */
  onTeardown: () => void
}

interface FieldUniforms {
  uTime: THREE.IUniform<number>
  uSize: THREE.IUniform<THREE.Vector2>
  uCursor: THREE.IUniform<THREE.Vector2>
  uCursorActive: THREE.IUniform<number>
  uTurb: THREE.IUniform<number>
  uParallax: THREE.IUniform<THREE.Vector2>
  uAtlas: THREE.IUniform<THREE.CanvasTexture>
  uColorA: THREE.IUniform<THREE.Color>
  uColorB: THREE.IUniform<THREE.Color>
  uGrid: THREE.IUniform<number>
  uRipples: THREE.IUniform<THREE.Vector4[]>
  [name: string]: THREE.IUniform
}

interface FieldAttrs {
  cell: THREE.InstancedBufferAttribute
  rand: THREE.InstancedBufferAttribute
  depth: THREE.InstancedBufferAttribute
  birth: THREE.InstancedBufferAttribute
}

interface FieldBuild {
  geometry: THREE.InstancedBufferGeometry
  material: THREE.ShaderMaterial
  texture: THREE.CanvasTexture
  uniforms: FieldUniforms
  attrs: FieldAttrs
  /** First index of the §4.2d spawn ring (mutates on governor downgrade). */
  fieldCount: number
}

/** aBirth sentinel: dormant spawn slot (renders at alpha 0 until first use). */
const BIRTH_DORMANT = -1e3
/** aBirth sentinel: ordinary field glyph (normal alpha path). */
const BIRTH_FIELD = -1

function buildField(tier: ActiveTier): FieldBuild | null {
  const texture = createGlyphAtlasTexture()
  if (!texture) return null

  // §4.2d: the buffer carries the field glyphs plus a 32-instance spawn ring
  // reserved as the LAST instances.
  const fieldCount = particleCount(tier)
  const count = fieldCount + SPAWN_RING_SIZE
  const rand = createSeededRandom('signal-field')
  const cells = new Float32Array(count * 2)
  const rands = new Float32Array(count * 4)
  const depths = new Float32Array(count)
  const births = new Float32Array(count)

  // §4.2b ternary depth split: first 15% far, next 35% mid, rest near.
  const farEnd = fieldCount * LAYER_SPLIT[0]
  const midEnd = fieldCount * (LAYER_SPLIT[0] + LAYER_SPLIT[1])

  for (let i = 0; i < count; i++) {
    const spawnSlot = i >= fieldCount
    // Spawn slots park far off-field until a keypress claims them.
    cells[i * 2] = spawnSlot ? 5 : rand() - 0.5
    cells[i * 2 + 1] = spawnSlot ? 5 : rand() - 0.5
    rands[i * 4] = rand()
    rands[i * 4 + 1] = rand()
    // Ambient field samples only the code-glyph prefix (v1 aesthetic).
    rands[i * 4 + 2] = Math.floor(rand() * FIELD_GLYPH_COUNT)
    rands[i * 4 + 3] = rand()
    depths[i] = spawnSlot ? 1 : i < farEnd ? 0 : i < midEnd ? 0.5 : 1
    births[i] = spawnSlot ? BIRTH_DORMANT : BIRTH_FIELD
  }

  const plane = new THREE.PlaneGeometry(1, 1)
  const geometry = new THREE.InstancedBufferGeometry()
  geometry.index = plane.index
  geometry.setAttribute('position', plane.getAttribute('position'))
  geometry.setAttribute('uv', plane.getAttribute('uv'))
  const attrs: FieldAttrs = {
    cell: new THREE.InstancedBufferAttribute(cells, 2),
    rand: new THREE.InstancedBufferAttribute(rands, 4),
    depth: new THREE.InstancedBufferAttribute(depths, 1),
    birth: new THREE.InstancedBufferAttribute(births, 1),
  }
  geometry.setAttribute('aCell', attrs.cell)
  geometry.setAttribute('aRand', attrs.rand)
  geometry.setAttribute('aDepth', attrs.depth)
  geometry.setAttribute('aBirth', attrs.birth)
  geometry.instanceCount = count

  const uniforms: FieldUniforms = {
    uTime: { value: 0 },
    uSize: { value: new THREE.Vector2(1, 1) },
    uCursor: { value: new THREE.Vector2(0, 0) },
    uCursorActive: { value: 0 },
    uTurb: { value: 0 },
    uParallax: { value: new THREE.Vector2(0, 0) },
    uAtlas: { value: texture },
    // Real values are read from the CSS tokens after mount (theme-aware).
    uColorA: { value: new THREE.Color(1, 1, 1) },
    uColorB: { value: new THREE.Color(1, 1, 1) },
    uGrid: { value: ATLAS_GRID },
    // §4.2c ring buffer of 4 click ripples; t0 = -1e3 marks an idle slot.
    uRipples: {
      value: [
        new THREE.Vector4(0, 0, BIRTH_DORMANT, 0),
        new THREE.Vector4(0, 0, BIRTH_DORMANT, 0),
        new THREE.Vector4(0, 0, BIRTH_DORMANT, 0),
        new THREE.Vector4(0, 0, BIRTH_DORMANT, 0),
      ],
    },
  }

  const material = new THREE.ShaderMaterial({
    vertexShader: glyphVertexShader,
    fragmentShader: glyphFragmentShader,
    uniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  })

  return { geometry, material, texture, uniforms, attrs, fieldCount }
}

/** Mark a one-instance slice of an instanced attribute for partial upload. */
function touchInstance(attr: THREE.InstancedBufferAttribute, index: number): void {
  attr.addUpdateRange(index * attr.itemSize, attr.itemSize)
  attr.needsUpdate = true
}

/** The hero canvas intersects the viewport (spawn/ripple gate §4.2). */
function canvasOnScreen(rect: DOMRect): boolean {
  return rect.bottom > 0 && rect.top < window.innerHeight && rect.width > 0
}

function Field({ initialTier, onReady, onTierChange, onTeardown }: GlyphSceneProps) {
  const advance = useThree((s) => s.advance)
  const gl = useThree((s) => s.gl)
  const size = useThree((s) => s.size)
  const scene = useThree((s) => s.scene)

  // Built once per mount; initialTier changes require a remount (parent does
  // unmount/remount around off-screen states, so this holds).
  const [built] = useState<FieldBuild | null>(() => buildField(initialTier))
  const initialTierRef = useRef(initialTier)

  const cbRef = useRef({ onReady, onTierChange, onTeardown })
  useEffect(() => {
    cbRef.current = { onReady, onTierChange, onTeardown }
  }, [onReady, onTierChange, onTeardown])

  // Atlas construction failed ⇒ static fallback.
  useEffect(() => {
    if (built === null) cbRef.current.onTeardown()
  }, [built])

  // Context loss ⇒ permanent teardown (§5.5).
  useEffect(() => {
    const el = gl.domElement
    const onLost = (e: Event) => {
      e.preventDefault()
      cbRef.current.onTeardown()
    }
    el.addEventListener('webglcontextlost', onLost)
    return () => el.removeEventListener('webglcontextlost', onLost)
  }, [gl])

  // Mount the mesh imperatively (avoids reliance on JSX intrinsics) + dispose.
  useEffect(() => {
    if (!built) return
    const mesh = new THREE.Mesh(built.geometry, built.material)
    mesh.frustumCulled = false
    scene.add(mesh)
    return () => {
      scene.remove(mesh)
      built.geometry.dispose()
      built.material.dispose()
      built.texture.dispose()
    }
  }, [built, scene])

  // Field spread follows the canvas size (world units are CSS pixels).
  useEffect(() => {
    if (!built) return
    built.uniforms.uSize.value.set(size.width, size.height)
  }, [built, size])

  // Accent colors from the CSS tokens; follows html[data-theme] live.
  useEffect(() => {
    if (!built) return
    const apply = () => {
      const styles = getComputedStyle(document.documentElement)
      const signal = styles.getPropertyValue('--accent-signal').trim()
      const electron = styles.getPropertyValue('--accent-electron').trim()
      if (signal) built.uniforms.uColorA.value.set(signal)
      if (electron) built.uniforms.uColorB.value.set(electron)
    }
    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    return () => observer.disconnect()
  }, [built])

  // §4.2c click ripples: pointerdown while the hero is on screen writes the
  // click into the 4-slot uniform ring — uniform writes only, zero geometry.
  const rippleNextRef = useRef(0)
  useEffect(() => {
    if (!built) return
    const onPointerDown = (e: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect()
      if (!canvasOnScreen(rect)) return
      const slot = built.uniforms.uRipples.value[rippleNextRef.current % 4] as THREE.Vector4
      rippleNextRef.current += 1
      slot.set(
        e.clientX - rect.left - rect.width / 2,
        -(e.clientY - rect.top - rect.height / 2),
        built.uniforms.uTime.value,
        0,
      )
    }
    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [built, gl])

  // §4.2d THE SPAWN: printable keypresses materialize as their glyph in the
  // field. Observes only — never preventDefault; the ⌘K/konami handlers on
  // the same document keep working. Ignores modified keys, focused inputs /
  // textareas / contenteditables, the open palette, and demo-driven input.
  const spawnNextRef = useRef(0)
  const caretElRef = useRef<Element | null>(null)
  useEffect(() => {
    if (!built) return
    const { uniforms, attrs } = built
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key.length !== 1) return // non-printable
      const glyph = glyphIndexOf(e.key)
      if (glyph < 0) return // whitespace has no drawable glyph
      const store = useSignalStore.getState()
      if (store.paletteOpen || store.demoRunning) return
      const ae = document.activeElement as HTMLElement | null
      if (ae) {
        const tag = ae.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || ae.isContentEditable)
          return
      }
      const rect = gl.domElement.getBoundingClientRect()
      if (!canvasOnScreen(rect)) return

      // Position: last pointer position (CursorHalo's --mx/--my vars); else
      // just below the h1 caret; else canvas center-right.
      const rootStyle = document.documentElement.style
      let cx = parseFloat(rootStyle.getPropertyValue('--mx'))
      let cy = parseFloat(rootStyle.getPropertyValue('--my'))
      if (Number.isNaN(cx) || Number.isNaN(cy) || cx < -500 || cy < -500) {
        if (caretElRef.current === null || !caretElRef.current.isConnected) {
          caretElRef.current = document.querySelector('#hero h1 .caret')
        }
        if (caretElRef.current) {
          const cr = caretElRef.current.getBoundingClientRect()
          cx = cr.left + cr.width / 2
          cy = cr.bottom + 24
        } else {
          cx = rect.left + rect.width * 0.75
          cy = rect.top + rect.height / 2
        }
      }

      const slot = built.fieldCount + (spawnNextRef.current % SPAWN_RING_SIZE)
      spawnNextRef.current += 1
      const size = uniforms.uSize.value
      // aCell is normalized [-0.5, 0.5] (base = aCell × uSize) — seeding it
      // from the spawn point lets the curl flow carry the glyph off.
      attrs.cell.setXY(
        slot,
        (cx - rect.left - rect.width / 2) / Math.max(size.x, 1),
        -(cy - rect.top - rect.height / 2) / Math.max(size.y, 1),
      )
      attrs.rand.setZ(slot, glyph)
      attrs.birth.setX(slot, uniforms.uTime.value)
      touchInstance(attrs.cell, slot)
      touchInstance(attrs.rand, slot)
      touchInstance(attrs.birth, slot)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [built, gl])

  // The one frame driver: shared ticker → uniforms → governor → advance().
  useEffect(() => {
    if (!built) return
    const { uniforms, geometry } = built
    const governor = new TierGovernor(initialTierRef.current, (tier) => {
      if (tier === 0) {
        cbRef.current.onTeardown()
        return
      }
      // §4.2d: keep the spawn ring alive as the LAST 32 live instances —
      // copy its attribute block to the new tail before shrinking the range.
      const nextField = Math.min(TIER_PARTICLES[tier], particleCount(initialTierRef.current))
      if (nextField < built.fieldCount) {
        const { attrs } = built
        for (const attr of [attrs.cell, attrs.rand, attrs.depth, attrs.birth]) {
          const item = attr.itemSize
          ;(attr.array as Float32Array).copyWithin(
            nextField * item,
            built.fieldCount * item,
            (built.fieldCount + SPAWN_RING_SIZE) * item,
          )
          attr.addUpdateRange(nextField * item, SPAWN_RING_SIZE * item)
          attr.needsUpdate = true
        }
        built.fieldCount = nextField
      }
      geometry.instanceCount = nextField + SPAWN_RING_SIZE
      cbRef.current.onTierChange(tier)
    })

    let lastScroll = window.scrollY
    let turb = 0
    let readyFired = false
    // First frames carry shader-compile/upload cost; keep them out of the
    // governor's rolling average so a cold start can't trigger a downgrade.
    let warmupFrames = 12

    const unsubscribe = subscribeTicker((dtMs, nowMs) => {
      const dt = Math.max(dtMs, 0.01)
      uniforms.uTime.value += dt / 1000

      // Cursor (from CursorHalo's --mx/--my; -999px is the "no pointer" state).
      const rootStyle = document.documentElement.style
      const mxRaw = parseFloat(rootStyle.getPropertyValue('--mx'))
      const myRaw = parseFloat(rootStyle.getPropertyValue('--my'))
      const mx = Number.isNaN(mxRaw) ? -999 : mxRaw
      const my = Number.isNaN(myRaw) ? -999 : myRaw
      const cursorActive = mx > -500 && my > -500
      if (cursorActive) {
        const rect = gl.domElement.getBoundingClientRect()
        uniforms.uCursor.value.set(
          mx - rect.left - rect.width / 2,
          -(my - rect.top - rect.height / 2),
        )
        const nx = (mx / window.innerWidth - 0.5) * 2
        const ny = (my / window.innerHeight - 0.5) * 2
        uniforms.uParallax.value.set(-nx * 12, ny * 12)
      }
      uniforms.uCursorActive.value = cursorActive ? 1 : 0

      // Scroll-velocity turbulence: clamp(|v|/3000, 0, 1), decay 0.9/frame.
      const scrollY = window.scrollY
      const velocity = Math.abs(scrollY - lastScroll) / (dt / 1000)
      lastScroll = scrollY
      const target = Math.min(Math.max(velocity / 3000, 0), 1)
      turb = Math.max(target, turb * 0.9)
      uniforms.uTurb.value = turb

      if (warmupFrames > 0) warmupFrames -= 1
      else governor.sample(dtMs, nowMs)
      advance(nowMs)

      if (!readyFired) {
        readyFired = true
        cbRef.current.onReady()
      }
    })

    return unsubscribe
  }, [built, advance, gl])

  return null
}

export default function GlyphScene(props: GlyphSceneProps) {
  return (
    <Canvas
      orthographic
      frameloop="never"
      dpr={[1, DPR_CAP]}
      camera={{ position: [0, 0, 100], zoom: 1, near: 0.1, far: 1000 }}
      gl={{
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: 'high-performance',
      }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <Field {...props} />
    </Canvas>
  )
}
