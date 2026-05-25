/**
 * @gatoseya/closer-click-support
 *
 * Web Component (custom element) `<closer-click-support>` reutilizable por
 * CUALQUIER app del ecosistema Closer Click (Vue o vanilla), que muestra un
 * modal de "apoya el proyecto" con enlaces configurables.
 *
 * Filosofía Closer Click: NO carga JS de terceros ni setea cookies. El modal
 * es 100% autohosteado (Shadow DOM); lo único externo es el enlace de salida
 * que abre el usuario explícitamente en una pestaña nueva.
 *
 * Uso vanilla:
 *   <script type="module" src=".../closer-click-support/src/index.js"></script>
 *   <closer-click-support href="https://ko-fi.com/usuario"></closer-click-support>
 *
 * Uso Vue 3 (el tag funciona tal cual; opcionalmente configurá
 * `isCustomElement` en compilerOptions si tu setup se queja):
 *   import '@gatoseya/closer-click-support'
 *   <closer-click-support href="https://ko-fi.com/usuario" lang="auto" />
 *
 * API:
 *   Atributos:
 *     href        URL de soporte única (p. ej. https://ko-fi.com/usuario)
 *     links       JSON: [{ "label": "Ko-fi", "href": "..." }, ...] (uno o varios)
 *     cta         Texto del botón disparador (default según idioma)
 *     no-trigger  Si está, no renderiza botón; abrí con el método open()
 *     heading     Título del modal (override)
 *     message     Cuerpo del modal (override)
 *     lang        'es' | 'en' | 'auto' (default 'auto')
 *     variant     'solid' (default) | 'ghost' — estilo del disparador
 *   Métodos:    el.open(), el.close()
 *   Eventos:    'cc-support-open', 'cc-support-close' (bubbles, composed)
 */

import { COIN_DATA_URI } from './coin.js'

const I18N = {
  es: {
    cta: 'Apoyar',
    heading: 'Apoya el proyecto',
    message:
      'Si esta herramienta te resulta útil, podés invitarme un café. Las apps del ecosistema Closer Click son gratuitas y autohosteadas. ¡Gracias!',
    close: 'Cerrar',
    defaultLink: 'Apoyar',
    hint: 'Apoya el Proyecto',
  },
  en: {
    cta: 'Support',
    heading: 'Support the project',
    message:
      'If you find this tool useful, you can buy me a coffee. The Closer Click ecosystem apps are free and self-hosted. Thank you!',
    close: 'Close',
    defaultLink: 'Support',
    hint: 'Support the project',
  },
}

const STYLE = `
  :host { all: initial; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
  * { box-sizing: border-box; }

  .trigger {
    font: inherit;
    font-weight: 600;
    font-size: 0.9rem;
    padding: 0.5rem 1.1rem;
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.25s ease;
    white-space: nowrap;
    border: 1px solid transparent;
  }
  .trigger.solid {
    background: #3498db;
    color: #fff;
    box-shadow: 0 2px 10px rgba(52, 152, 219, 0.35);
  }
  .trigger.solid:hover { background: #2980b9; transform: translateY(-1px); }
  .trigger.ghost {
    background: transparent;
    color: currentColor;
    border-color: rgba(127, 127, 127, 0.5);
  }
  .trigger.ghost:hover { border-color: currentColor; }

  /* Moneda flotante: arriba a la derecha de cualquier app */
  .trigger.coin {
    position: fixed;
    top: 14px;
    right: 14px;
    z-index: 2147483000;
    padding: 0;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: transparent;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.35);
    line-height: 0;
    overflow: hidden;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .trigger.coin:hover {
    transform: translateY(-1px) scale(1.06) rotate(-6deg);
    box-shadow: 0 5px 16px rgba(0, 0, 0, 0.45);
  }
  .trigger.coin img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: contain;
    pointer-events: none;
  }
  @media (max-width: 480px) {
    .trigger.coin { width: 44px; height: 44px; top: 10px; right: 10px; }
  }

  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(3px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    z-index: 2147483000;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
  }
  .overlay.open { opacity: 1; pointer-events: auto; }

  .modal {
    background: #1f2c3a;
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 16px;
    max-width: 420px;
    width: 100%;
    padding: 2rem 1.75rem 1.75rem;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    transform: translateY(12px) scale(0.98);
    transition: transform 0.2s ease;
    position: relative;
  }
  .overlay.open .modal { transform: none; }

  .close {
    position: absolute;
    top: 0.6rem;
    right: 0.6rem;
    width: 2rem;
    height: 2rem;
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.7);
    font-size: 1.4rem;
    line-height: 1;
    cursor: pointer;
    border-radius: 50%;
    transition: all 0.2s ease;
  }
  .close:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }

  .heading { font-size: 1.4rem; font-weight: 700; margin: 0 0 0.75rem; color: #3498db; }
  .message { font-size: 0.98rem; line-height: 1.6; margin: 0 0 1.5rem; opacity: 0.92; }

  .links { display: flex; flex-direction: column; gap: 0.6rem; }
  .link {
    display: inline-block;
    text-decoration: none;
    font-weight: 600;
    font-size: 1rem;
    padding: 0.75rem 1.5rem;
    border-radius: 50px;
    background: #3498db;
    color: #fff;
    transition: all 0.25s ease;
    box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
  }
  .link:hover { background: #2980b9; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4); }
`

class CloserClickSupport extends HTMLElement {
  static get observedAttributes() {
    return ['href', 'links', 'cta', 'no-trigger', 'heading', 'message', 'lang', 'variant', 'inline', 'hint', 'coin']
  }

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this._onKeydown = this._onKeydown.bind(this)
  }

  connectedCallback() {
    this._render()
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this._onKeydown)
  }

  attributeChangedCallback() {
    if (this.shadowRoot.childElementCount) this._render()
  }

  /* ---- idioma ---- */
  get _lang() {
    const attr = (this.getAttribute('lang') || 'auto').toLowerCase()
    if (attr === 'es' || attr === 'en') return attr
    const doc = (document.documentElement.lang || '').toLowerCase()
    const nav = (navigator.language || '').toLowerCase()
    return (doc || nav).startsWith('en') ? 'en' : 'es'
  }

  get _t() {
    return I18N[this._lang]
  }

  /* ---- enlaces ---- */
  get _links() {
    const raw = this.getAttribute('links')
    if (raw) {
      try {
        const arr = JSON.parse(raw)
        if (Array.isArray(arr)) {
          return arr
            .filter((x) => x && x.href)
            .map((x) => ({ href: String(x.href), label: x.label ? String(x.label) : this._labelFor(x.href) }))
        }
      } catch {
        /* atributo links inválido: se ignora */
      }
    }
    const href = this.getAttribute('href')
    return href ? [{ href, label: this._labelFor(href) }] : []
  }

  _labelFor(href) {
    try {
      const host = new URL(href).hostname.replace(/^www\./, '')
      if (host.includes('ko-fi')) return 'Ko-fi'
      if (host.includes('paypal')) return 'PayPal'
      if (host.includes('patreon')) return 'Patreon'
      if (host.includes('github')) return 'GitHub Sponsors'
      return this._t.defaultLink
    } catch {
      return this._t.defaultLink
    }
  }

  /* ---- API pública ---- */
  open() {
    const overlay = this.shadowRoot.querySelector('.overlay')
    if (!overlay) return
    overlay.classList.add('open')
    document.addEventListener('keydown', this._onKeydown)
    this.dispatchEvent(new CustomEvent('cc-support-open', { bubbles: true, composed: true }))
  }

  close() {
    const overlay = this.shadowRoot.querySelector('.overlay')
    if (!overlay) return
    overlay.classList.remove('open')
    document.removeEventListener('keydown', this._onKeydown)
    this.dispatchEvent(new CustomEvent('cc-support-close', { bubbles: true, composed: true }))
  }

  _onKeydown(e) {
    if (e.key === 'Escape') this.close()
  }

  /* ---- render ---- */
  _render() {
    const t = this._t
    const heading = this.getAttribute('heading') || t.heading
    const message = this.getAttribute('message') || t.message
    const cta = this.getAttribute('cta') || t.cta
    const variant = this.getAttribute('variant') === 'ghost' ? 'ghost' : 'solid'
    const hint = this.getAttribute('hint') || t.hint
    const coinSrc = this.getAttribute('coin') || COIN_DATA_URI
    const inline = this.hasAttribute('inline')
    const hasTrigger = !this.hasAttribute('no-trigger')
    const links = this._links

    // Trigger por defecto: moneda flotante arriba a la derecha (hint "Apoya el Proyecto").
    // Con `inline` se usa un botón de texto (cta/variant) en el flujo del documento.
    const triggerHtml = !hasTrigger
      ? ''
      : inline
        ? `<button type="button" class="trigger ${variant}" part="trigger" title="${escapeAttr(hint)}" aria-label="${escapeAttr(hint)}">${escapeHtml(cta)}</button>`
        : `<button type="button" class="trigger coin" part="trigger" title="${escapeAttr(hint)}" aria-label="${escapeAttr(hint)}"><img src="${escapeAttr(coinSrc)}" alt="" /></button>`

    const linksHtml = links
      .map(
        (l) =>
          `<a class="link" href="${escapeAttr(l.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(
            l.label,
          )}</a>`,
      )
      .join('')

    this.shadowRoot.innerHTML = `
      <style>${STYLE}</style>
      ${triggerHtml}
      <div class="overlay" role="dialog" aria-modal="true" aria-label="${escapeAttr(heading)}">
        <div class="modal" part="modal">
          <button type="button" class="close" aria-label="${escapeAttr(t.close)}">&times;</button>
          <h2 class="heading">${escapeHtml(heading)}</h2>
          <p class="message">${escapeHtml(message)}</p>
          <div class="links">${linksHtml}</div>
        </div>
      </div>
    `

    const trigger = this.shadowRoot.querySelector('.trigger')
    if (trigger) trigger.addEventListener('click', () => this.open())

    const overlay = this.shadowRoot.querySelector('.overlay')
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close()
    })
    this.shadowRoot.querySelector('.close').addEventListener('click', () => this.close())
  }
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, '&quot;')
}

if (typeof customElements !== 'undefined' && !customElements.get('closer-click-support')) {
  customElements.define('closer-click-support', CloserClickSupport)
}

export { CloserClickSupport }
export default CloserClickSupport
