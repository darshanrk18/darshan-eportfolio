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
import { createSeededRandom } from '@/lib/utils/seeded'
import { ATLAS_GLYPHS, createGlyphAtlasTexture } from './atlas'
import { glyphFragmentShader, glyphVertexShader } from './shaders'
import { DPR_CAP, FAR_LAYER_RATIO, particleCount, type ActiveTier } from './tiers'

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
  [name: string]: THREE.IUniform
}

interface FieldBuild {
  geometry: THREE.InstancedBufferGeometry
  material: THREE.ShaderMaterial
  texture: THREE.CanvasTexture
  uniforms: FieldUniforms
}

function buildField(tier: ActiveTier): FieldBuild | null {
  const texture = createGlyphAtlasTexture()
  if (!texture) return null

  const count = particleCount(tier)
  const rand = createSeededRandom('signal-field')
  const cells = new Float32Array(count * 2)
  const rands = new Float32Array(count * 4)
  const depths = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    cells[i * 2] = rand() - 0.5
    cells[i * 2 + 1] = rand() - 0.5
    rands[i * 4] = rand()
    rands[i * 4 + 1] = rand()
    rands[i * 4 + 2] = Math.floor(rand() * ATLAS_GLYPHS.length)
    rands[i * 4 + 3] = rand()
    depths[i] = i < count * FAR_LAYER_RATIO ? 0 : 1
  }

  const plane = new THREE.PlaneGeometry(1, 1)
  const geometry = new THREE.InstancedBufferGeometry()
  geometry.index = plane.index
  geometry.setAttribute('position', plane.getAttribute('position'))
  geometry.setAttribute('uv', plane.getAttribute('uv'))
  geometry.setAttribute('aCell', new THREE.InstancedBufferAttribute(cells, 2))
  geometry.setAttribute('aRand', new THREE.InstancedBufferAttribute(rands, 4))
  geometry.setAttribute('aDepth', new THREE.InstancedBufferAttribute(depths, 1))
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
  }

  const material = new THREE.ShaderMaterial({
    vertexShader: glyphVertexShader,
    fragmentShader: glyphFragmentShader,
    uniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  })

  return { geometry, material, texture, uniforms }
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

  // The one frame driver: shared ticker → uniforms → governor → advance().
  useEffect(() => {
    if (!built) return
    const { uniforms, geometry } = built
    const governor = new TierGovernor(initialTierRef.current, (tier) => {
      if (tier === 0) {
        cbRef.current.onTeardown()
        return
      }
      geometry.instanceCount = Math.min(TIER_PARTICLES[tier], particleCount(initialTierRef.current))
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
