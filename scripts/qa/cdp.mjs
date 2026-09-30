/**
 * Headless-Chrome (CDP) render + probe driver for v3 QA. No browser pane.
 *
 *   node scripts/qa/cdp.mjs <plan.json> [--base http://127.0.0.1:3150]
 *
 * A plan is a JSON array of steps run in order in ONE tab:
 *   { "viewport": [1280, 900] }                       device metrics (mobile when width < 768)
 *   { "seed": { "edition": "print" | "screen" | null, "intro": true, "guide": [...], "coach": [...], "console": true, "motion": "reduced" } }
 *       → an init script (runs before every navigation) that writes
 *         localStorage['signal.edition'], sessionStorage['signal.intro']='1', localStorage['signal.guide'] (JSON), sessionStorage['signal.coach'], sessionStorage['signal.console'], localStorage['signal.motion']
 *         edition null / absent key = nothing stored (first visit → the picker)
 *   { "goto": "/" }                                   navigate (waits for load + fonts)
 *   { "wait": 800 }                                   ms
 *   { "scroll": "#about", "block": "start" }          scrollIntoView (instant) + settle
 *   { "scrollTo": 99999 }                             window.scrollTo(0, y)
 *   { "eval": "document.title" , "label": "title" }   prints the result
 *   { "click": "css" } | { "clickText": "Try it" }    dispatches a real mouse click at the element's centre
 *   { "key": "Escape" } | { "type": "choose" }        keyboard input
 *   { "shot": "out.png", "full": false }              screenshot (full = full page)
 *   { "text": "out.txt" }                             document.body.innerText dump (after mounting lazy islands: scroll through first)
 *   { "aria": "out.json" }                            every aria-label / title attribute on the page
 *   { "sweep": true }                                 scroll through the page in viewport steps so lazy islands mount, then back to top
 *   { "console": "out.txt" }                          console + exception log so far
 *   { "probe": "css", "label": "x" }                  prints getBoundingClientRect of the first match (+ scrollWidth)
 */
import { spawn } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

const [, , planPath, ...rest] = process.argv
const BASE = rest.includes('--base') ? rest[rest.indexOf('--base') + 1] : 'http://127.0.0.1:3150'
if (!planPath) {
  console.error('usage: node scripts/qa/cdp.mjs <plan.json> [--base url]')
  process.exit(2)
}
const plan = JSON.parse(readFileSync(planPath, 'utf8'))

const PORT = 9500 + (process.pid % 400)
const CH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const chrome = spawn(
  CH,
  [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    '--force-device-scale-factor=1',
    `--user-data-dir=/tmp/cdp-qa-${PORT}-${process.pid}`,
    `--remote-debugging-port=${PORT}`,
    'about:blank',
  ],
  { stdio: 'ignore' }
)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let ver
for (let i = 0; i < 80; i++) {
  try {
    ver = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json()
    break
  } catch {
    await sleep(250)
  }
}
const ws = new WebSocket(ver.webSocketDebuggerUrl)
await new Promise((r) => (ws.onopen = r))
let id = 0
const pending = new Map()
const logs = []
ws.onmessage = (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m)
    pending.delete(m.id)
    return
  }
  if (m.method === 'Runtime.consoleAPICalled') {
    const args = (m.params.args || []).map((a) => a.value ?? a.description ?? '').join(' ')
    logs.push(`[console.${m.params.type}] ${args}`)
  } else if (m.method === 'Runtime.exceptionThrown') {
    const d = m.params.exceptionDetails
    logs.push(`[exception] ${d.text} ${d.exception?.description ?? ''}`)
  } else if (m.method === 'Log.entryAdded') {
    const en = m.params.entry
    if (en.level === 'error' || en.level === 'warning')
      logs.push(`[log.${en.level}] ${en.text} ${en.url ?? ''}`)
  }
}
const send = (method, params = {}, sessionId) =>
  new Promise((res) => {
    const i = ++id
    pending.set(i, res)
    ws.send(JSON.stringify({ id: i, method, params, sessionId }))
  })
const {
  result: { targetId },
} = await send('Target.createTarget', { url: 'about:blank' })
const {
  result: { sessionId },
} = await send('Target.attachToTarget', { targetId, flatten: true })
const S = (m, p) => send(m, p, sessionId)
await S('Page.enable')
await S('Runtime.enable')
await S('Log.enable')
await S('DOM.enable')

const evalJs = async (expression, awaitPromise = false) => {
  const r = await S('Runtime.evaluate', { expression, awaitPromise, returnByValue: true })
  if (r.result?.exceptionDetails) return { error: r.result.exceptionDetails.text }
  return r.result?.result?.value
}
const out = (p, data) => {
  mkdirSync(dirname(p), { recursive: true })
  writeFileSync(p, data)
}
const centre = async (selector, text) => {
  const expr = text
    ? `(() => { const els = Array.from(document.querySelectorAll('button, a, [role=button], summary, input, label, span, li, div')); const el = els.find(e => e.children.length === 0 ? (e.textContent || '').trim() === ${JSON.stringify(text)} : false) || els.find(e => (e.textContent || '').trim() === ${JSON.stringify(text)}); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height } })()`
    : `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height } })()`
  return evalJs(expr)
}
const clickAt = async (x, y) => {
  await S('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y })
  await S('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 })
  await S('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x,
    y,
    button: 'left',
    clickCount: 1,
  })
}

for (const step of plan) {
  if (step.viewport) {
    const [w, h] = step.viewport
    await S('Emulation.setDeviceMetricsOverride', {
      width: w,
      height: h,
      deviceScaleFactor: 1,
      mobile: w < 768,
    })
    if (w < 768) await S('Emulation.setTouchEmulationEnabled', { enabled: true })
  } else if (step.seed !== undefined) {
    const s = step.seed || {}
    const src = `(() => { try {
      ${s.edition ? `localStorage.setItem('signal.edition', ${JSON.stringify(s.edition)});` : `localStorage.removeItem('signal.edition');`}
      ${s.intro ? `sessionStorage.setItem('signal.intro', '1');` : `sessionStorage.removeItem('signal.intro');`}
      ${s.guide ? `localStorage.setItem('signal.guide', ${JSON.stringify(JSON.stringify(s.guide))});` : `localStorage.removeItem('signal.guide');`}
      ${s.coach ? `sessionStorage.setItem('signal.coach', ${JSON.stringify(JSON.stringify(s.coach))});` : `sessionStorage.removeItem('signal.coach');`}
      ${s.console ? `sessionStorage.setItem('signal.console', '1');` : ``}
      ${s.motion ? `localStorage.setItem('signal.motion', ${JSON.stringify(s.motion)});` : `localStorage.removeItem('signal.motion');`}
    } catch (e) {} })()`
    await S('Page.addScriptToEvaluateOnNewDocument', { source: src })
  } else if (step.goto) {
    const url = step.goto.startsWith('http') ? step.goto : BASE + step.goto
    await S('Page.navigate', { url })
    await sleep(step.settle ?? 1800)
    await Promise.race([evalJs('document.fonts.ready.then(() => 1)', true), sleep(5000)])
    await sleep(300)
  } else if (step.wait) {
    await sleep(step.wait)
  } else if (step.scroll) {
    await evalJs(
      `(() => { const el = document.querySelector(${JSON.stringify(step.scroll)}); if (!el) return 'MISSING ' + ${JSON.stringify(step.scroll)}; el.scrollIntoView({ block: ${JSON.stringify(step.block ?? 'start')}, behavior: 'instant' }); return window.scrollY })()`
    ).then((v) => (typeof v === 'string' ? console.log(v) : null))
    await sleep(step.settle ?? 1400)
  } else if (step.scrollTo !== undefined) {
    await evalJs(`window.scrollTo({ top: ${Number(step.scrollTo)}, behavior: 'instant' })`)
    await sleep(step.settle ?? 1000)
  } else if (step.sweep) {
    await evalJs(
      `(async () => { const h = () => document.documentElement.scrollHeight; const step = window.innerHeight * 0.8; for (let y = 0; y < h(); y += step) { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, ${step.pause ?? 350})); } window.scrollTo({ top: h(), behavior: 'instant' }); await new Promise(r => setTimeout(r, 600)); window.scrollTo({ top: 0, behavior: 'instant' }); return h() })()`,
      true
    )
    await sleep(600)
  } else if (step.eval) {
    const v = await evalJs(step.eval, !!step.await)
    console.log(`[${step.label ?? 'eval'}]`, typeof v === 'string' ? v : JSON.stringify(v))
  } else if (step.click || step.clickText) {
    const c = await centre(step.click, step.clickText)
    if (!c) {
      console.log('CLICK MISSING', step.click ?? step.clickText)
    } else {
      await clickAt(c.x, c.y)
    }
    await sleep(step.settle ?? 600)
  } else if (step.key) {
    const keyMap = {
      Escape: 27,
      Enter: 13,
      Tab: 9,
      ArrowRight: 39,
      ArrowLeft: 37,
      ArrowDown: 40,
      ArrowUp: 38,
    }
    const key = step.key
    const code = keyMap[key]
    const base = { key, code: key, windowsVirtualKeyCode: code, nativeVirtualKeyCode: code }
    if (key.length === 1) {
      await S('Input.dispatchKeyEvent', { type: 'keyDown', key, text: key })
      await S('Input.dispatchKeyEvent', { type: 'keyUp', key })
    } else {
      await S('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...base })
      if (key === 'Enter') await S('Input.dispatchKeyEvent', { type: 'char', text: '\r', ...base })
      await S('Input.dispatchKeyEvent', { type: 'keyUp', ...base })
    }
    await sleep(step.settle ?? 400)
  } else if (step.type) {
    await S('Input.insertText', { text: step.type })
    await sleep(step.settle ?? 400)
  } else if (step.shot) {
    const params = { format: 'png' }
    if (step.full) {
      const m = await evalJs(
        '({ w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight })'
      )
      params.captureBeyondViewport = true
      params.clip = { x: 0, y: 0, width: m.w, height: Math.min(m.h, 16000), scale: 1 }
    }
    const { result } = await S('Page.captureScreenshot', params)
    out(step.shot, Buffer.from(result.data, 'base64'))
    console.log('wrote', step.shot)
  } else if (step.text) {
    const t = await evalJs('document.body.innerText')
    out(step.text, t ?? '')
    console.log('wrote', step.text)
  } else if (step.aria) {
    const a = await evalJs(
      `JSON.stringify(Array.from(document.querySelectorAll('[aria-label],[title],[alt],[placeholder]')).map(e => ({ tag: e.tagName.toLowerCase(), label: e.getAttribute('aria-label'), title: e.getAttribute('title'), alt: e.getAttribute('alt'), placeholder: e.getAttribute('placeholder'), text: (e.textContent || '').trim().slice(0, 60) })))`
    )
    out(step.aria, a ?? '[]')
    console.log('wrote', step.aria)
  } else if (step.console) {
    out(step.console, logs.join('\n') + '\n')
    console.log('wrote', step.console, `(${logs.length} entries)`)
  } else if (step.probe) {
    const v = await evalJs(
      `(() => { const el = document.querySelector(${JSON.stringify(step.probe)}); if (!el) return 'MISSING'; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), display: cs.display, visibility: cs.visibility, opacity: cs.opacity, scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth } })()`
    )
    console.log(`[probe ${step.label ?? step.probe}]`, JSON.stringify(v))
  }
}

ws.close()
chrome.kill()
process.exit(0)
