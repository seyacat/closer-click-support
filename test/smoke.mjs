import { chromium } from '../../closer-click-store/node_modules/playwright/index.mjs'
import { fileURLToPath } from 'node:url'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'

const pkgRoot = fileURLToPath(new URL('..', import.meta.url))

const html = `<!doctype html><html lang="en"><body>
<closer-click-support id="auto" inline links='[{"label":"Ko-fi","href":"https://ko-fi.com/u"},{"href":"https://paypal.me/u"}]'></closer-click-support>
<closer-click-support id="es" lang="es" href="https://ko-fi.com/u" no-trigger></closer-click-support>
<closer-click-support id="coin" lang="es" href="https://ko-fi.com/closerclick"></closer-click-support>
<closer-click-support id="bug" lang="es" href="https://ko-fi.com/closerclick" repo="closerclick/closerclick" discord="https://discord.gg/D648uq7cth"></closer-click-support>
<script type="module" src="/src/index.js"></script>
</body></html>`

// Servidor estático mínimo (los ES modules requieren http, no file://).
const server = createServer(async (req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    res.setHeader('content-type', 'text/html')
    return res.end(html)
  }
  try {
    const body = await readFile(pkgRoot + req.url.replace(/^\//, ''))
    res.setHeader('content-type', req.url.endsWith('.js') ? 'text/javascript' : 'application/octet-stream')
    res.end(body)
  } catch {
    res.statusCode = 404
    res.end('not found')
  }
})
await new Promise((r) => server.listen(0, r))
const baseUrl = `http://localhost:${server.address().port}/`

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
await page.goto(baseUrl, { waitUntil: 'networkidle' })
await page.waitForFunction(
  () => customElements.get('closer-click-support') && document.querySelector('#auto')?.shadowRoot?.querySelector('.trigger'),
  null,
  { timeout: 5000 },
)

const results = {}

// 1. registrado
results.defined = await page.evaluate(() => !!customElements.get('closer-click-support'))

// 2. botón disparador con idioma EN (auto desde <html lang="en">)
results.triggerLabel = await page.evaluate(() =>
  document.querySelector('#auto').shadowRoot.querySelector('.trigger').textContent.trim(),
)

// 3. abrir y contar enlaces
results.openWorks = await page.evaluate(() => {
  const el = document.querySelector('#auto')
  el.open()
  const ov = el.shadowRoot.querySelector('.overlay')
  return ov.open === true
})
results.linkCount = await page.evaluate(
  () => document.querySelector('#auto').shadowRoot.querySelectorAll('.link').length,
)
results.linkLabels = await page.evaluate(() =>
  [...document.querySelector('#auto').shadowRoot.querySelectorAll('.link')].map((a) => a.textContent.trim()),
)
results.linkTarget = await page.evaluate(
  () => document.querySelector('#auto').shadowRoot.querySelector('.link').getAttribute('rel'),
)

// 4. cerrar con Escape
results.escCloses = await page.evaluate(async () => {
  const el = document.querySelector('#auto')
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
  return !el.shadowRoot.querySelector('.overlay').open
})

// 5. no-trigger no renderiza botón + idioma ES
results.noTrigger = await page.evaluate(
  () => !document.querySelector('#es').shadowRoot.querySelector('.trigger'),
)
results.esHeading = await page.evaluate(() =>
  document.querySelector('#es').shadowRoot.querySelector('.heading').textContent.trim(),
)

// 6. moneda flotante por defecto: coin con hint y posición fixed top-right
results.coinIsImg = await page.evaluate(
  () => !!document.querySelector('#coin').shadowRoot.querySelector('.trigger.coin img'),
)
results.coinHint = await page.evaluate(
  () => document.querySelector('#coin').shadowRoot.querySelector('.trigger.coin').getAttribute('aria-label'),
)
// integrado (no flotante): el botón no es fixed y el host es inline-block relativo
results.coinIntegrated = await page.evaluate(() => {
  const el = document.querySelector('#coin')
  const btn = el.shadowRoot.querySelector('.trigger.coin')
  const hostCs = getComputedStyle(el)
  return getComputedStyle(btn).position !== 'fixed' && hostCs.display === 'inline-block' && hostCs.position === 'relative'
})
// la burbuja se posiciona respecto a la moneda (absolute, debajo)
results.bubbleAnchored = await page.evaluate(
  () => getComputedStyle(document.querySelector('#coin').shadowRoot.querySelector('.bubble')).position === 'absolute',
)
// hover sobre la moneda muestra la burbuja
results.bubbleOnHover = await page.evaluate(async () => {
  const el = document.querySelector('#coin')
  el._hideBubble()
  el.shadowRoot.querySelector('.trigger.coin').dispatchEvent(new MouseEvent('mouseenter'))
  await new Promise((r) => setTimeout(r, 50))
  return el.shadowRoot.querySelector('.bubble').classList.contains('show')
})
// la moneda ya no tiene title nativo (se usa la burbuja)
results.coinNoTitle = await page.evaluate(
  () => !document.querySelector('#coin').shadowRoot.querySelector('.trigger.coin').getAttribute('title'),
)
results.coinHasImage = await page.evaluate(
  () => (document.querySelector('#coin').shadowRoot.querySelector('.trigger.coin img').getAttribute('src') || '').startsWith('data:image/png;base64,'),
)

// 7. burbuja "Apoya el Proyecto": existe, aparece sola y luego se oculta al abrir
results.bubbleText = await page.evaluate(
  () => document.querySelector('#coin').shadowRoot.querySelector('.bubble')?.textContent.trim(),
)
await page.waitForTimeout(1000)
results.bubbleAutoShown = await page.evaluate(
  () => document.querySelector('#coin').shadowRoot.querySelector('.bubble').classList.contains('show'),
)
results.bubbleHidesOnOpen = await page.evaluate(() => {
  const el = document.querySelector('#coin')
  el.open()
  const hidden = !el.shadowRoot.querySelector('.bubble').classList.contains('show')
  el.close()
  return hidden
})
// la burbuja se va con blur de la ventana
results.bubbleHidesOnBlur = await page.evaluate(async () => {
  const el = document.querySelector('#coin')
  el._bubbleAutoShown = false
  el._render()
  await new Promise((r) => setTimeout(r, 850))
  const shown = el.shadowRoot.querySelector('.bubble').classList.contains('show')
  window.dispatchEvent(new Event('blur'))
  const hiddenAfter = !el.shadowRoot.querySelector('.bubble').classList.contains('show')
  return shown && hiddenAfter
})

// el modal se cierra con blur de la ventana
results.modalClosesOnBlur = await page.evaluate(async () => {
  const el = document.querySelector('#coin')
  el.open()
  const opened = el.shadowRoot.querySelector('.overlay').open === true
  window.dispatchEvent(new Event('blur'))
  await new Promise((r) => setTimeout(r, 30))
  return opened && !el.shadowRoot.querySelector('.overlay').open
})

// 8. evento cc-support-open
results.eventFired = await page.evaluate(
  () =>
    new Promise((resolve) => {
      const el = document.querySelector('#es')
      el.addEventListener('cc-support-open', () => resolve(true), { once: true })
      el.open()
      setTimeout(() => resolve(false), 500)
    }),
)

// 9. sección compartir: 4 redes; whatsapp lleva la URL actual; instagram copia
results.shareCount = await page.evaluate(
  () => document.querySelector('#coin').shadowRoot.querySelectorAll('.share-btn').length,
)
results.shareWhatsappHasUrl = await page.evaluate(() => {
  const a = document.querySelector('#coin').shadowRoot.querySelector('.share-list a')
  return (a.getAttribute('href') || '').includes(encodeURIComponent(location.href))
})
results.shareInstagramIsButton = await page.evaluate(
  () => !!document.querySelector('#coin').shadowRoot.querySelector('.share-btn[data-share="instagram"]'),
)

// 10. la moneda rota: el .flipper tiene tamaño y la animación cc-flip aplicada
results.flipperAnimates = await page.evaluate(() => {
  const fl = document.querySelector('#coin').shadowRoot.querySelector('.flipper')
  const cs = getComputedStyle(fl)
  return fl.offsetWidth > 0 && fl.offsetHeight > 0 && cs.animationName === 'cc-flip'
})

// 11. reportar error: con repo, el flipper tiene 3 caras (cc-flip3) y una cara
// de bug; el modal muestra el enlace directo a los issues del repo.
results.bugFlipperThree = await page.evaluate(() => {
  const fl = document.querySelector('#bug').shadowRoot.querySelector('.flipper')
  return fl.classList.contains('three') && getComputedStyle(fl).animationName === 'cc-flip3'
})
results.bugFaceCount = await page.evaluate(
  () => document.querySelector('#bug').shadowRoot.querySelectorAll('.flipper .face').length,
)
results.bugLinkHref = await page.evaluate(
  () => document.querySelector('#bug').shadowRoot.querySelector('.bug-link')?.getAttribute('href'),
)
results.bugLinkTarget = await page.evaluate(
  () => document.querySelector('#bug').shadowRoot.querySelector('.bug-link')?.getAttribute('rel'),
)
results.bugLabel = await page.evaluate(
  () => document.querySelector('#bug').shadowRoot.querySelector('.bug-link')?.textContent.trim(),
)
// sin repo/bug-href no hay sección bug ni cara extra (#coin sigue con 2 caras)
results.noBugWhenUnset = await page.evaluate(() => {
  const sr = document.querySelector('#coin').shadowRoot
  return !sr.querySelector('.bug-link') && sr.querySelectorAll('.flipper .face').length === 2
})

// 12. comunidad: con discord, el modal muestra el enlace a Discord
results.discordHref = await page.evaluate(
  () => document.querySelector('#bug').shadowRoot.querySelector('.discord-link')?.getAttribute('href'),
)
results.discordLabel = await page.evaluate(
  () => document.querySelector('#bug').shadowRoot.querySelector('.discord-link')?.textContent.trim(),
)
results.noDiscordWhenUnset = await page.evaluate(
  () => !document.querySelector('#coin').shadowRoot.querySelector('.discord-link'),
)

await browser.close()
server.close()

const expect = {
  defined: true,
  triggerLabel: 'Support',
  openWorks: true,
  linkCount: 2,
  linkLabels: ['Ko-fi', 'PayPal'],
  linkTarget: 'noopener noreferrer',
  escCloses: true,
  noTrigger: true,
  esHeading: 'Apoya al proyecto',
  coinIsImg: true,
  coinHint: 'Donar/Compartir',
  coinIntegrated: true,
  bubbleAnchored: true,
  bubbleOnHover: true,
  coinNoTitle: true,
  coinHasImage: true,
  bubbleText: 'Donar/Compartir',
  bubbleAutoShown: true,
  bubbleHidesOnOpen: true,
  bubbleHidesOnBlur: true,
  shareCount: 4,
  shareWhatsappHasUrl: true,
  shareInstagramIsButton: true,
  flipperAnimates: true,
  modalClosesOnBlur: true,
  eventFired: true,
  bugFlipperThree: true,
  bugFaceCount: 3,
  bugLinkHref: 'https://github.com/closerclick/closerclick/issues',
  bugLinkTarget: 'noopener noreferrer',
  bugLabel: 'Reporta un error',
  noBugWhenUnset: true,
  discordHref: 'https://discord.gg/D648uq7cth',
  discordLabel: 'Canal de Soporte',
  noDiscordWhenUnset: true,
}

let ok = true
for (const [k, v] of Object.entries(expect)) {
  const got = JSON.stringify(results[k])
  const want = JSON.stringify(v)
  const pass = got === want
  if (!pass) ok = false
  console.log(`${pass ? '✓' : '✗'} ${k}: ${got}${pass ? '' : ` (esperado ${want})`}`)
}
if (errors.length) {
  ok = false
  console.log('Errores de página:', errors)
}
console.log(ok ? '\nTODOS LOS TESTS PASARON' : '\nFALLARON TESTS')
process.exit(ok ? 0 : 1)
