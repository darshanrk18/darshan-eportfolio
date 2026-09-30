#!/usr/bin/env node
/**
 * Browser smoke test. Drives a real Chrome over the DevTools protocol (the
 * raw CDP approach of scripts/qa/cdp.mjs, no dependencies) through the paths
 * a visitor takes, and exits 1 if any of them is broken.
 *
 *   node scripts/qa/smoke.mjs [--base http://localhost:3000] [--out <dir>]
 *   npm run smoke -- --base https://www.darshankonnur.com
 *
 * Chrome: $CHROME_PATH, else the first that exists of /usr/bin/google-chrome,
 * /usr/bin/google-chrome-stable, /usr/bin/chromium, /usr/bin/chromium-browser
 * and the macOS app bundles.
 *
 * Checks (each in a fresh browser context, so storage starts empty):
 *   (a) first visit to '/' at 1280: the server-rendered picker is in the
 *       HTML and on screen; choosing SCREEN sets html[data-edition=screen],
 *       shows the hero and removes the picker
 *   (b) the top bar's toggle switches to PRINT and back to SCREEN
 *   (c) a fresh first visit choosing PRINT: the intro mounts, Skip ends it,
 *       html[data-edition=print] and the cover is visible
 *   (d) reloading that visit (PRINT stored, intro seen) shows PRINT with no
 *       picker and no intro
 *   (e) /cv renders its heading and loads no script of its own over 1 KB
 *   (f) /work/ticket-forge renders
 *   (g) /arcade renders
 *   (h) an unknown path answers HTTP 404 and renders the not-found page
 *   (i) at 375 x 812, '/' has no horizontal overflow in either edition
 *   (j) across all of the above: no uncaught exception, no console error
 *
 * Console policy for (j): every uncaught exception, console.error() and
 * browser-logged error counts, with two exceptions. Requests to analytics
 * hosts (ANALYTICS_HOSTS) are blocked, so a smoke run never counts as a
 * visit on the live site and never depends on a third party; the errors
 * Chrome logs for those blocked requests are ignored. The 404 check's own
 * document response is expected and ignored. Nothing else is filtered.
 *
 * Waits are on conditions with timeouts, never fixed sleeps. On a failure
 * the page's screenshot and the full console log are written to --out
 * (default: a new temp directory, printed at the end).
 *
 * Exit codes: 0 all checks passed, 1 a check failed, 2 could not start
 * (no Chrome, or the base URL does not answer).
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

/* ------------------------------------------------------------------ args */

const argv = process.argv.slice(2)
const arg = (name, fallback) => {
  const i = argv.indexOf(name)
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback
}
if (argv.includes('--help') || argv.includes('-h')) {
  console.log('usage: node scripts/qa/smoke.mjs [--base http://localhost:3000] [--out <dir>]')
  process.exit(0)
}
const BASE = arg('--base', process.env.SMOKE_BASE ?? 'http://localhost:3000').replace(/\/+$/, '')
const OUT = path.resolve(arg('--out', mkdtempSync(path.join(tmpdir(), 'smoke-'))))
mkdirSync(OUT, { recursive: true })

/* ------------------------------------------------------------- constants */

const DESKTOP = { width: 1280, height: 900, mobile: false }
const PHONE = { width: 375, height: 812, mobile: true }
const NAV_TIMEOUT = 30_000
const WAIT_TIMEOUT = 15_000
const RUN_TIMEOUT = 4 * 60_000

/* Storage keys and attributes the site uses (lib/edition/prepaint.ts). */
const EDITION_KEY = 'signal.edition'
const INTRO_KEY = 'signal.intro'

/* Analytics is blocked and its request errors ignored (see the header). */
const ANALYTICS_HOSTS = [
  'googletagmanager.com',
  'google-analytics.com',
  'analytics.google.com',
  'doubleclick.net',
]
const BLOCKED_URLS = ANALYTICS_HOSTS.map((h) => `*${h}*`)
const isAnalytics = (s) => ANALYTICS_HOSTS.some((h) => (s ?? '').includes(h))

const MISSING_PATH = '/this-page-does-not-exist-smoke'

/* ---------------------------------------------------------------- chrome */

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ].filter(Boolean)
  return candidates.find((p) => existsSync(p))
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function die(message) {
  console.error(`smoke: ${message}`)
  cleanup()
  process.exit(2)
}

let chrome = null
let profileDir = null
function cleanup() {
  if (chrome && chrome.exitCode === null) chrome.kill('SIGKILL')
  chrome = null
  if (profileDir) {
    try {
      rmSync(profileDir, { recursive: true, force: true })
    } catch {
      /* a locked profile file is not worth failing over */
    }
    profileDir = null
  }
}
process.on('exit', cleanup)
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    cleanup()
    process.exit(130)
  })
}

async function launchChrome(bin) {
  profileDir = mkdtempSync(path.join(tmpdir(), 'smoke-profile-'))
  const flags = [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--mute-audio',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-component-update',
    '--disable-sync',
    '--force-device-scale-factor=1',
    `--user-data-dir=${profileDir}`,
    '--remote-debugging-port=0',
    'about:blank',
  ]
  // GitHub's Ubuntu runners restrict unprivileged user namespaces, which
  // Chrome's sandbox needs; the smoke test only visits the site under test.
  if (process.platform === 'linux') flags.unshift('--no-sandbox', '--disable-dev-shm-usage')
  if (process.platform === 'darwin') flags.unshift('--use-mock-keychain')

  chrome = spawn(bin, flags, { stdio: ['ignore', 'ignore', 'pipe'] })
  let stderr = ''
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Chrome did not start in 30 s\n${stderr.slice(-2000)}`)),
      30_000
    )
    chrome.stderr.on('data', (chunk) => {
      stderr += chunk
      const m = stderr.match(/DevTools listening on (ws:\/\/\S+)/)
      if (m) {
        clearTimeout(timer)
        resolve(m[1])
      }
    })
    chrome.on('exit', (code) => {
      clearTimeout(timer)
      reject(new Error(`Chrome exited (${code}) before it was ready\n${stderr.slice(-2000)}`))
    })
  })
}

/* ------------------------------------------------------------ CDP client */

class Cdp {
  constructor(ws) {
    this.ws = ws
    this.id = 0
    this.pending = new Map()
    this.listeners = new Set()
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data)
      if (m.id && this.pending.has(m.id)) {
        const { resolve, reject, method } = this.pending.get(m.id)
        this.pending.delete(m.id)
        if (m.error) reject(new Error(`${method}: ${m.error.message}`))
        else resolve(m.result)
        return
      }
      for (const fn of this.listeners) fn(m)
    }
  }
  send(method, params = {}, sessionId) {
    return new Promise((resolve, reject) => {
      const id = ++this.id
      this.pending.set(id, { resolve, reject, method })
      this.ws.send(JSON.stringify({ id, method, params, sessionId }))
    })
  }
}

/** Every console/exception entry of the run, for the log file and (j). */
const allLogs = []
const allErrors = []
/** Requests the blocklist stopped (analytics). */
const blocked = []

class Tab {
  static async open(cdp, label, { viewport = DESKTOP, seed } = {}) {
    const { browserContextId } = await cdp.send('Target.createBrowserContext', {
      disposeOnDetach: true,
    })
    const { targetId } = await cdp.send('Target.createTarget', {
      url: 'about:blank',
      browserContextId,
    })
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true })
    const tab = new Tab(cdp, label, { browserContextId, targetId, sessionId })
    await tab.S('Page.enable')
    await tab.S('Page.setLifecycleEventsEnabled', { enabled: true })
    await tab.S('Runtime.enable')
    await tab.S('Log.enable')
    await tab.S('Network.enable')
    await tab.S('Network.setBlockedURLs', { urls: BLOCKED_URLS })
    await tab.setViewport(viewport)
    if (seed) await tab.seed(seed)
    return tab
  }

  constructor(cdp, label, ids) {
    Object.assign(this, ids)
    this.cdp = cdp
    this.label = label
    this.inflight = new Map() // requestId → url
    this.documents = new Map() // loaderId → HTTP status of the document
    this.ignoreDocErrorsFor = new Set()
    this.waiters = []
    this.listener = (m) => {
      if (m.sessionId === this.sessionId) this.onEvent(m)
    }
    cdp.listeners.add(this.listener)
  }

  S(method, params) {
    return this.cdp.send(method, params, this.sessionId)
  }

  record(kind, text, url) {
    const entry = { check: this.label, kind, text: text.trim(), url: url ?? '' }
    allLogs.push(entry)
    const ignored =
      isAnalytics(url) ||
      isAnalytics(text) ||
      (kind === 'log.error' && this.ignoreDocErrorsFor.has(url) && /\b404\b/.test(text))
    if (kind !== 'console.log' && !ignored) allErrors.push(entry)
  }

  onEvent({ method, params }) {
    switch (method) {
      case 'Runtime.exceptionThrown': {
        const d = params.exceptionDetails
        this.record('exception', `${d.text} ${d.exception?.description ?? ''}`, d.url)
        break
      }
      case 'Runtime.consoleAPICalled': {
        const text = (params.args ?? []).map((a) => a.value ?? a.description ?? '').join(' ')
        if (params.type === 'error' || params.type === 'assert') this.record('console.error', text)
        else allLogs.push({ check: this.label, kind: `console.${params.type}`, text, url: '' })
        break
      }
      case 'Log.entryAdded': {
        const e = params.entry
        if (e.level === 'error') this.record('log.error', e.text, e.url)
        break
      }
      case 'Network.requestWillBeSent':
        // A worker's own script (no loaderId) finishes in the worker's
        // target, not this one: it would look in flight forever.
        if (!params.loaderId) break
        this.inflight.set(params.requestId, params.request.url)
        this.lastNetwork = Date.now()
        break
      case 'Network.loadingFailed':
        if (params.blockedReason) blocked.push(this.inflight.get(params.requestId))
      // falls through
      case 'Network.loadingFinished':
        this.inflight.delete(params.requestId)
        this.lastNetwork = Date.now()
        break
      case 'Network.responseReceived':
        if (params.type === 'Document') this.documents.set(params.loaderId, params.response.status)
        break
      default:
    }
    for (const w of [...this.waiters]) {
      if (w.method === method && w.test(params)) {
        this.waiters.splice(this.waiters.indexOf(w), 1)
        w.resolve(params)
      }
    }
  }

  waitEvent(method, test = () => true, timeout = NAV_TIMEOUT) {
    return new Promise((resolve, reject) => {
      const w = { method, test, resolve }
      this.waiters.push(w)
      setTimeout(() => {
        const i = this.waiters.indexOf(w)
        if (i >= 0) {
          this.waiters.splice(i, 1)
          reject(new Error(`timed out after ${timeout / 1000} s waiting for ${method}`))
        }
      }, timeout)
    })
  }

  async setViewport({ width, height, mobile }) {
    await this.S('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile,
    })
    await this.S('Emulation.setTouchEmulationEnabled', {
      enabled: mobile,
      maxTouchPoints: mobile ? 5 : 1,
    })
  }

  /** Storage written before any page script, on every navigation of this tab. */
  async seed({ edition, introSeen }) {
    const source = `(() => { try {
      ${edition ? `localStorage.setItem(${JSON.stringify(EDITION_KEY)}, ${JSON.stringify(edition)});` : ''}
      ${introSeen ? `sessionStorage.setItem(${JSON.stringify(INTRO_KEY)}, '1');` : ''}
    } catch (e) {} })()`
    await this.S('Page.addScriptToEvaluateOnNewDocument', { source })
  }

  /** Runs before page scripts: records what the page looked like at DOMContentLoaded. */
  async recordDomContentLoaded() {
    const source = `document.addEventListener('DOMContentLoaded', () => {
      const html = document.documentElement
      const shell = document.querySelector('[data-pk-shell]')
      const r = shell && shell.getBoundingClientRect()
      window.__smokeDcl = {
        pick: html.getAttribute('data-pick'),
        live: html.hasAttribute('data-picker-live'),
        shell: !!shell,
        shellVisible: !!shell && getComputedStyle(shell).display !== 'none' && r.width > 0 && r.height > 0,
      }
    }, { once: true })`
    await this.S('Page.addScriptToEvaluateOnNewDocument', { source })
  }

  /** Navigate and wait for the load event; returns the document's HTTP status. */
  async goto(pathOrUrl) {
    const url = pathOrUrl.startsWith('http') ? pathOrUrl : BASE + pathOrUrl
    const loaded = this.waitEvent('Page.loadEventFired')
    const nav = await this.S('Page.navigate', { url })
    if (nav.errorText) throw new Error(`could not load ${url}: ${nav.errorText}`)
    await loaded
    await this.fontsReady()
    return this.documents.get(nav.loaderId)
  }

  async reload() {
    const loaded = this.waitEvent('Page.loadEventFired')
    await this.S('Page.reload', { ignoreCache: false })
    await loaded
    await this.fontsReady()
  }

  async fontsReady() {
    await this.until('document.fonts.status === "loaded"', 'web fonts to load', WAIT_TIMEOUT)
  }

  async eval(expression) {
    const r = await this.S('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    })
    if (r.exceptionDetails) {
      throw new Error(
        `page script failed: ${r.exceptionDetails.exception?.description ?? r.exceptionDetails.text}`
      )
    }
    return r.result?.value
  }

  /** Poll an expression until it is truthy; throws `waiting for <what>` on timeout. */
  async until(expression, what, timeout = WAIT_TIMEOUT) {
    const end = Date.now() + timeout
    let last
    while (Date.now() < end) {
      last = await this.eval(expression)
      if (last) return last
      await sleep(100)
    }
    throw new Error(`timed out after ${timeout / 1000} s waiting for ${what}`)
  }

  /** Soft wait: no request in flight for `quietMs` (gives up quietly after `timeout`). */
  async networkIdle(quietMs = 500, timeout = 10_000) {
    const end = Date.now() + timeout
    this.lastNetwork ??= Date.now()
    while (Date.now() < end) {
      if (this.inflight.size === 0 && Date.now() - this.lastNetwork >= quietMs) return true
      await sleep(100)
    }
    allLogs.push({
      check: this.label,
      kind: 'note',
      text: `network still busy after ${timeout / 1000} s: ${[...this.inflight.values()].join(', ')}`,
      url: '',
    })
    return false
  }

  /** A real mouse click at the centre of the first match, after checking nothing covers it. */
  async click(selector, what) {
    await this.until(
      `(() => {
      const el = document.querySelector(${JSON.stringify(selector)})
      if (!el) return false
      el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' })
      const r = el.getBoundingClientRect()
      return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'
    })()`,
      `${what} to be on screen`
    )
    const hit = await this.eval(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)})
      const r = el.getBoundingClientRect()
      const x = r.left + r.width / 2, y = r.top + r.height / 2
      const top = document.elementFromPoint(x, y)
      const describe = (n) => n ? n.tagName.toLowerCase() + (n.className && typeof n.className === 'string' ? '.' + n.className.trim().split(/\\s+/).join('.') : '') : 'nothing'
      return { x, y, covered: !(top && (top === el || el.contains(top))), by: describe(top) }
    })()`)
    if (hit.covered) throw new Error(`${what} is covered by ${hit.by}`)
    const at = { x: hit.x, y: hit.y }
    await this.S('Input.dispatchMouseEvent', { type: 'mouseMoved', ...at })
    await this.S('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      ...at,
      button: 'left',
      clickCount: 1,
    })
    await this.S('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      ...at,
      button: 'left',
      clickCount: 1,
    })
  }

  /** Scroll through the page so every lazy island mounts, then back to the top. */
  async sweep() {
    await this.eval(`(async () => {
      const frames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight * 0.8) {
        window.scrollTo({ top: y, behavior: 'instant' })
        await frames()
      }
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })
      await frames()
    })()`)
    await this.networkIdle()
    await this.eval(`(async () => {
      window.scrollTo({ top: 0, behavior: 'instant' })
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    })()`)
  }

  async screenshot(file) {
    try {
      const { data } = await this.S('Page.captureScreenshot', { format: 'png' })
      writeFileSync(path.join(OUT, file), Buffer.from(data, 'base64'))
      return file
    } catch {
      return null
    }
  }

  async close() {
    this.cdp.listeners.delete(this.listener)
    await this.cdp.send('Target.closeTarget', { targetId: this.targetId }).catch(() => {})
    await this.cdp
      .send('Target.disposeBrowserContext', { browserContextId: this.browserContextId })
      .catch(() => {})
  }
}

/* ------------------------------------------------------- page predicates */

/** Visible: displayed, not visibility:hidden, has a box, and (optionally) opaque enough. */
const visible = (selector, minOpacity = 0) => `(() => {
  const el = document.querySelector(${JSON.stringify(selector)})
  if (!el) return false
  const r = el.getBoundingClientRect()
  if (r.width === 0 || r.height === 0) return false
  for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
    const cs = getComputedStyle(n)
    if (cs.display === 'none' || cs.visibility === 'hidden') return false
    if (${minOpacity} > 0 && Number(cs.opacity) < ${minOpacity}) return false
  }
  return true
})()`

const edition = (name) =>
  `document.documentElement.getAttribute('data-edition') === ${JSON.stringify(name)}`
const noPicker = `(!document.documentElement.hasAttribute('data-pick') &&
  !document.querySelector('.pk-live') &&
  ![...document.querySelectorAll('[data-pk-shell]')].some((s) => getComputedStyle(s).display !== 'none'))`
const switchSettled = `(!document.documentElement.hasAttribute('data-edition-switch') &&
  !document.querySelector('[data-component="EditionToggle"][data-switching]'))`
const stored = (key, store = 'localStorage') => `${store}.getItem(${JSON.stringify(key)})`
const heroName = '#hero h1'
const navToggle = (ed) =>
  `[data-component="Navbar"] [data-component="EditionToggle"] button[data-ed="${ed}"]`

/* ---------------------------------------------------------------- checks */

async function firstVisitScreen(tab) {
  const html = await (await fetch(`${BASE}/`)).text()
  if (!html.includes('data-pk-shell'))
    throw new Error("the picker is not in the server's HTML for '/'")

  await tab.recordDomContentLoaded()
  await tab.goto('/')
  const dcl = await tab.eval('window.__smokeDcl')
  if (!dcl || dcl.pick !== '1')
    throw new Error('a first visit did not mark html[data-pick] before DOMContentLoaded')
  if (!dcl.shell)
    throw new Error('the server-rendered picker was not in the DOM at DOMContentLoaded')
  if (!dcl.shellVisible && !dcl.live)
    throw new Error('the server-rendered picker was not visible at DOMContentLoaded')

  await tab.until(
    `document.documentElement.getAttribute('data-picker-live') === '1'`,
    'the interactive picker to take over'
  )
  await tab.click('.pk-live .pk-half-s', 'the SCREEN half of the picker')
  await tab.until(`${edition('screen')} && ${noPicker}`, 'the picker to close on SCREEN')
  await tab.until(visible(heroName, 0.9), 'the hero name to be visible')
  if ((await tab.eval(stored(EDITION_KEY))) !== 'screen')
    throw new Error('the SCREEN choice was not remembered')
  return 'picker painted from the server; SCREEN chosen, hero shown, picker gone'
}

async function toggleEditions(tab) {
  await tab.click(navToggle('print'), "the top bar's PRINT button")
  await tab.until(`${edition('print')} && ${switchSettled}`, 'the switch to PRINT to finish')
  await tab.until(
    `document.querySelector(${JSON.stringify(navToggle('print'))}).getAttribute('aria-pressed') === 'true'`,
    'the PRINT button to read as pressed'
  )
  if ((await tab.eval(stored(EDITION_KEY))) !== 'print')
    throw new Error('the switch to PRINT was not remembered')

  await tab.click(navToggle('screen'), "the top bar's SCREEN button")
  await tab.until(`${edition('screen')} && ${switchSettled}`, 'the switch back to SCREEN to finish')
  if ((await tab.eval(stored(EDITION_KEY))) !== 'screen')
    throw new Error('the switch back to SCREEN was not remembered')
  return 'SCREEN → PRINT → SCREEN from the top bar'
}

async function firstVisitPrint(tab) {
  await tab.goto('/')
  await tab.until(
    `document.documentElement.getAttribute('data-picker-live') === '1'`,
    'the interactive picker to take over'
  )
  await tab.click('.pk-live .pk-half-p', 'the PRINT half of the picker')
  await tab.until(`!!document.querySelector('[data-component="Intro"]')`, 'the intro to start')
  await tab.until(`!document.querySelector('.pk-live')`, 'the picker to hand over to the intro')
  await tab.click('[data-component="Intro"] .intro-skip', "the intro's Skip button")
  // Without Skip the intro runs for up to 14 s; the hand-off after Skip takes under 2 s.
  await tab.until(
    `!document.querySelector('[data-component="Intro"]')`,
    'the intro to end after Skip',
    6_000
  )
  await tab.until(`${edition('print')} && ${noPicker}`, 'PRINT to be in force')
  await tab.until(visible('#hero .hero-cover'), 'the PRINT cover to be visible')
  await tab.until(visible(heroName, 0.9), 'the cover name to be visible')
  if ((await tab.eval(stored(INTRO_KEY, 'sessionStorage'))) !== '1')
    throw new Error('the intro was not marked as seen')
  return 'PRINT chosen, intro skipped, cover shown'
}

async function returnPrint(tab) {
  await tab.reload()
  await tab.until(`${edition('print')} && ${noPicker}`, 'PRINT without the picker')
  if (await tab.eval(`document.documentElement.hasAttribute('data-intro')`)) {
    throw new Error('the intro was scheduled again after it had been seen')
  }
  await tab.until(visible('#hero .hero-cover'), 'the PRINT cover to be visible')
  if (await tab.eval(`!!document.querySelector('[data-component="Intro"]')`))
    throw new Error('the intro ran again')
  return 'reload keeps PRINT, no picker, no intro'
}

async function route(tab, pathname, expectStatus, extra) {
  const status = await tab.goto(pathname)
  if (status !== expectStatus)
    throw new Error(`${pathname} answered HTTP ${status}, expected ${expectStatus}`)
  await tab.until(visible('h1'), `${pathname} to show its heading`)
  const h1 = await tab.eval(`document.querySelector('h1').textContent.trim()`)
  await tab.networkIdle()
  if (extra) await extra(tab)
  return h1
}

async function cvPage(tab) {
  const h1 = await route(tab, '/cv', 200, async (t) => {
    const own = await t.eval(`performance.getEntriesByType('resource')
      .filter((e) => e.initiatorType === 'script' && e.name.includes('/app/cv/') && e.encodedBodySize > 1024)
      .map((e) => e.name)`)
    if (own.length) throw new Error(`/cv loads script of its own: ${own.join(', ')}`)
  })
  return `/cv renders "${h1}"`
}

async function workPage(tab) {
  const h1 = await route(tab, '/work/ticket-forge', 200)
  return `/work/ticket-forge renders "${h1}"`
}

async function arcadePage(tab) {
  const h1 = await route(tab, '/arcade', 200, async (t) => {
    await t.until(
      `document.querySelectorAll('.arcade-window').length >= 2`,
      'both arcade games to render'
    )
  })
  return `/arcade renders "${h1}" and both games`
}

async function notFound(tab) {
  tab.ignoreDocErrorsFor.add(BASE + MISSING_PATH)
  await route(tab, MISSING_PATH, 404, async (t) => {
    if (!(await t.eval(`document.title.includes('Page not found')`)))
      throw new Error('the 404 page has the wrong title')
    await t.until(`!!document.querySelector('main a[href="/"]')`, 'the link back to the home page')
  })
  return 'an unknown path answers 404 with the not-found page'
}

function phoneOverflow(name) {
  return async (tab) => {
    await tab.goto('/')
    await tab.until(`${edition(name)} && ${noPicker}`, `${name.toUpperCase()} without the picker`)
    await tab.until(visible(heroName), 'the hero name to be visible')
    await tab.sweep()
    const o = await tab.eval(`(() => {
      const w = window.innerWidth
      const sw = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)
      const wide = [...document.querySelectorAll('body *')]
        .filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.right > w + 1 && getComputedStyle(el).position !== 'fixed' })
        .slice(0, 5)
        .map((el) => el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\\s+/).slice(0, 3).join('.') : ''))
      return { w, sw, wide }
    })()`)
    if (o.sw > o.w) {
      throw new Error(
        `page is ${o.sw} px wide in a ${o.w} px viewport; widest elements: ${o.wide.join(', ') || 'unknown'}`
      )
    }
    return `375 px ${name.toUpperCase()}: no horizontal overflow (scrollWidth ${o.sw} ≤ ${o.w})`
  }
}

/* ------------------------------------------------------------------- run */

const CHECKS = [
  { id: 'a', name: 'first visit → SCREEN', tab: 'visit-screen', run: firstVisitScreen },
  { id: 'b', name: 'top-bar toggle', tab: 'visit-screen', run: toggleEditions },
  { id: 'c', name: 'first visit → PRINT → Skip', tab: 'visit-print', run: firstVisitPrint },
  { id: 'd', name: 'return visit in PRINT', tab: 'visit-print', run: returnPrint },
  { id: 'e', name: '/cv', tab: 'cv', run: cvPage },
  { id: 'f', name: '/work/ticket-forge', tab: 'work', run: workPage },
  { id: 'g', name: '/arcade', tab: 'arcade', run: arcadePage },
  { id: 'h', name: 'unknown path', tab: 'missing', run: notFound },
  {
    id: 'i',
    name: '375 px SCREEN',
    tab: 'phone-screen',
    open: { viewport: PHONE, seed: { edition: 'screen' } },
    run: phoneOverflow('screen'),
  },
  {
    id: 'i',
    name: '375 px PRINT',
    tab: 'phone-print',
    open: { viewport: PHONE, seed: { edition: 'print', introSeen: true } },
    run: phoneOverflow('print'),
  },
]

async function main() {
  const bin = findChrome()
  if (!bin) die('no Chrome found. Set CHROME_PATH to a Chrome or Chromium binary.')
  try {
    const res = await fetch(BASE, { redirect: 'manual', signal: AbortSignal.timeout(15_000) })
    if (res.status >= 500) die(`${BASE} answered HTTP ${res.status}`)
  } catch (error) {
    die(`${BASE} does not answer (${error.cause?.code ?? error.message})`)
  }

  const wsUrl = await launchChrome(bin).catch((error) => die(error.message))
  const ws = new WebSocket(wsUrl)
  await new Promise((resolve, reject) => {
    ws.onopen = resolve
    ws.onerror = () => reject(new Error('could not connect to Chrome'))
  }).catch((error) => die(error.message))
  const cdp = new Cdp(ws)
  const { product } = await cdp.send('Browser.getVersion')
  console.log(`smoke: ${BASE} (${product})`)

  const tabs = new Map()
  const broken = new Map() // tab name → the check that failed in it
  const results = []
  let failed = false
  for (const [index, check] of CHECKS.entries()) {
    const started = Date.now()
    // A check that continues a flow (same tab) cannot run once that flow broke.
    if (broken.has(check.tab)) {
      failed = true
      const detail = `not run: (${broken.get(check.tab)}) failed first`
      results.push({ id: check.id, name: check.name, ok: false, detail })
      console.log(`  FAIL  (${check.id}) ${check.name}: ${detail}`)
      continue
    }
    let tab = tabs.get(check.tab)
    try {
      if (!tab) {
        tab = await Tab.open(cdp, check.tab, check.open)
        tabs.set(check.tab, tab)
      }
      const detail = await check.run(tab)
      const ms = Date.now() - started
      results.push({ id: check.id, name: check.name, ok: true, detail, ms })
      console.log(`  ok    (${check.id}) ${detail} [${(ms / 1000).toFixed(1)} s]`)
    } catch (error) {
      failed = true
      broken.set(check.tab, check.id)
      const shot = tab ? await tab.screenshot(`fail-${check.id}-${check.tab}.png`) : null
      results.push({ id: check.id, name: check.name, ok: false, detail: error.message })
      console.log(
        `  FAIL  (${check.id}) ${check.name}: ${error.message}${shot ? ` [screenshot ${shot}]` : ''}`
      )
    }
    // Close a tab once no later check uses it (or its flow broke).
    const reused = CHECKS.slice(index + 1).some((c) => c.tab === check.tab)
    if (tabs.has(check.tab) && (!reused || broken.has(check.tab))) {
      await tabs.get(check.tab).close()
      tabs.delete(check.tab)
    }
  }

  if (allErrors.length === 0) {
    console.log(`  ok    (j) no uncaught exceptions or console errors`)
  } else {
    failed = true
    console.log(`  FAIL  (j) ${allErrors.length} console error(s) or uncaught exception(s):`)
    for (const e of allErrors.slice(0, 20)) {
      console.log(
        `          [${e.check}] ${e.kind}: ${e.text.split('\n')[0].slice(0, 300)}${e.url ? ` (${e.url})` : ''}`
      )
    }
  }

  const logFile = path.join(OUT, 'console.log')
  writeFileSync(
    logFile,
    allLogs
      .map((e) => `[${e.check}] ${e.kind}: ${e.text}${e.url ? ` (${e.url})` : ''}`)
      .join('\n') + '\n'
  )
  const report = { base: BASE, product, results, errors: allErrors, blockedAnalytics: blocked }
  writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(report, null, 2) + '\n')

  ws.close()
  cleanup()
  const passed = results.filter((r) => r.ok).length + (allErrors.length === 0 ? 1 : 0)
  const total = results.length + 1
  console.log(
    `smoke: ${passed}/${total} passed${failed ? `; screenshots and console log in ${OUT}` : ''}`
  )
  process.exit(failed ? 1 : 0)
}

const watchdog = setTimeout(() => {
  console.error(`smoke: the whole run exceeded ${RUN_TIMEOUT / 60_000} minutes`)
  cleanup()
  process.exit(1)
}, RUN_TIMEOUT)
watchdog.unref()

main().catch((error) => {
  console.error(`smoke: ${error.stack ?? error.message}`)
  cleanup()
  process.exit(1)
})
