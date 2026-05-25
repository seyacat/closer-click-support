import { chromium } from '../../closer-click-store/node_modules/playwright/index.mjs'
import { fileURLToPath } from 'node:url'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'

const pkgRoot = fileURLToPath(new URL('..', import.meta.url))

const html = `<!doctype html><html lang="en"><body>
<closer-click-support id="auto" inline links='[{"label":"Ko-fi","href":"https://ko-fi.com/u"},{"href":"https://paypal.me/u"}]'></closer-click-support>
<closer-click-support id="es" lang="es" href="https://ko-fi.com/u" no-trigger></closer-click-support>
<closer-click-support id="coin" lang="es" href="https://ko-fi.com/seyacat"></closer-click-support>
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
  return ov.classList.contains('open')
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
  return !el.shadowRoot.querySelector('.overlay').classList.contains('open')
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
  () => document.querySelector('#coin').shadowRoot.querySelector('.trigger.coin').getAttribute('title'),
)
results.coinFixed = await page.evaluate(() => {
  const btn = document.querySelector('#coin').shadowRoot.querySelector('.trigger.coin')
  const cs = getComputedStyle(btn)
  return cs.position === 'fixed' && parseInt(cs.right) < 40 && parseInt(cs.top) < 40
})
results.coinHasImage = await page.evaluate(
  () => (document.querySelector('#coin').shadowRoot.querySelector('.trigger.coin img').getAttribute('src') || '').startsWith('data:image/png;base64,'),
)

// 7. evento cc-support-open
results.eventFired = await page.evaluate(
  () =>
    new Promise((resolve) => {
      const el = document.querySelector('#es')
      el.addEventListener('cc-support-open', () => resolve(true), { once: true })
      el.open()
      setTimeout(() => resolve(false), 500)
    }),
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
  esHeading: 'Apoya el proyecto',
  coinIsImg: true,
  coinHint: 'Apoya el Proyecto',
  coinFixed: true,
  coinHasImage: true,
  eventFired: true,
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
