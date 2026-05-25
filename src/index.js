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
    heading: 'Apoya al proyecto',
    message:
      'Si esta herramienta te resulta útil, puedes dar una pequeña contribución. Las apps del ecosistema Closer Click son gratuitas y autohosteadas. ¡Gracias!',
    close: 'Cerrar',
    defaultLink: 'Donar',
    hint: 'Apoya al proyecto',
  },
  en: {
    cta: 'Support',
    heading: 'Support the project',
    message:
      'If you find this tool useful, you can make a small contribution. The Closer Click ecosystem apps are free and self-hosted. Thank you!',
    close: 'Close',
    defaultLink: 'Donate',
    hint: 'Support the project',
  },
}

const STYLE = `
  :host {
    all: initial;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    display: inline-block;
    position: relative;
    vertical-align: middle;
    line-height: 0;
  }
  /* Modo flotante opcional (apps sin barra superior): :host([floating]) */
  :host([floating]) {
    position: fixed;
    top: 14px;
    right: 14px;
    z-index: 2147483000;
  }
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

  /* Moneda: elemento integrado (no flotante). La app la ubica arriba a la derecha. */
  .trigger.coin {
    display: block;
    padding: 0;
    width: 38px;
    height: 38px;
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
    .trigger.coin { width: 32px; height: 32px; }
  }

  /* Burbuja: posicionada respecto a la moneda (debajo, extendida a la izquierda) */
  .bubble {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    z-index: 2147483000;
    background: #3498db;
    color: #fff;
    padding: 0.5rem 0.85rem;
    border-radius: 10px;
    font-size: 0.85rem;
    line-height: 1.2;
    font-weight: 600;
    white-space: nowrap;
    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.35);
    opacity: 0;
    transform: translateY(-8px) scale(0.96);
    transform-origin: top right;
    transition: opacity 0.3s ease, transform 0.3s ease;
    pointer-events: none;
    cursor: pointer;
  }
  .bubble.show { opacity: 1; transform: none; pointer-events: auto; }
  .bubble::after {
    content: '';
    position: absolute;
    top: -6px;
    right: 13px;
    border: 6px solid transparent;
    border-top: 0;
    border-bottom-color: #3498db;
  }
  @media (max-width: 480px) {
    .bubble { font-size: 0.8rem; padding: 0.4rem 0.7rem; }
    .bubble::after { right: 10px; }
  }

  /* <dialog> con showModal(): se renderiza en el top layer, así el modal se
     centra respecto a la página y NO queda contenido por el header/ancestros
     con transform/filter donde esté integrada la moneda. */
  .overlay {
    border: none;
    padding: 1rem;
    background: transparent;
    max-width: 100vw;
    max-height: 100vh;
    overflow: visible;
    color: #fff;
  }
  .overlay::backdrop { background: rgba(0, 0, 0, 0.55); backdrop-filter: blur(3px); }

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
    position: relative;
  }
  .overlay[open] .modal { animation: cc-pop 0.2s ease; }
  @keyframes cc-pop { from { transform: translateY(12px) scale(0.98); opacity: 0.4; } to { transform: none; opacity: 1; } }

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
    return ['href', 'links', 'cta', 'no-trigger', 'heading', 'message', 'lang', 'variant', 'inline', 'hint', 'coin', 'no-bubble', 'bubble-timeout']
  }

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this._onKeydown = this._onKeydown.bind(this)
    this._onBlur = () => this._hideBubble()
    this._onModalBlur = () => this.close()
    this._bubbleTimers = []
    this._bubbleAutoShown = false
    this._bubbleVisible = false
  }

  connectedCallback() {
    this._render()
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this._onKeydown)
    window.removeEventListener('blur', this._onBlur)
    window.removeEventListener('blur', this._onModalBlur)
    this._bubbleTimers.forEach(clearTimeout)
    this._bubbleTimers = []
    clearTimeout(this._hoverHideTimer)
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
      if (host.includes('ko-fi')) return this._t.defaultLink
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
    this._bubbleTimers.forEach(clearTimeout)
    this._bubbleTimers = []
    this._hideBubble()
    if (typeof overlay.showModal === 'function') {
      if (!overlay.open) overlay.showModal()
    } else {
      overlay.setAttribute('open', '') // fallback sin <dialog>
    }
    document.addEventListener('keydown', this._onKeydown)
    window.addEventListener('blur', this._onModalBlur)
    this.dispatchEvent(new CustomEvent('cc-support-open', { bubbles: true, composed: true }))
  }

  close() {
    const overlay = this.shadowRoot.querySelector('.overlay')
    if (!overlay) return
    document.removeEventListener('keydown', this._onKeydown)
    window.removeEventListener('blur', this._onModalBlur)
    if (typeof overlay.close === 'function') {
      if (overlay.open) overlay.close() // dispara 'close' -> emite cc-support-close
    } else {
      overlay.removeAttribute('open')
      this.dispatchEvent(new CustomEvent('cc-support-close', { bubbles: true, composed: true }))
    }
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
    // La burbuja solo acompaña a la moneda flotante (no al botón inline).
    const wantsBubble = hasTrigger && !inline && !this.hasAttribute('no-bubble')

    const triggerHtml = !hasTrigger
      ? ''
      : inline
        ? `<button type="button" class="trigger ${variant}" part="trigger" title="${escapeAttr(hint)}" aria-label="${escapeAttr(hint)}">${escapeHtml(cta)}</button>`
        : `<button type="button" class="trigger coin" part="trigger" aria-label="${escapeAttr(hint)}"><img src="${escapeAttr(coinSrc)}" alt="" /></button>`

    const bubbleHtml = wantsBubble
      ? `<div class="bubble" part="bubble" role="status">${escapeHtml(hint)}</div>`
      : ''

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
      ${bubbleHtml}
      <dialog class="overlay" part="overlay" aria-label="${escapeAttr(heading)}">
        <div class="modal" part="modal">
          <button type="button" class="close" aria-label="${escapeAttr(t.close)}">&times;</button>
          <h2 class="heading">${escapeHtml(heading)}</h2>
          <p class="message">${escapeHtml(message)}</p>
          <div class="links">${linksHtml}</div>
        </div>
      </dialog>
    `

    const trigger = this.shadowRoot.querySelector('.trigger')
    if (trigger) trigger.addEventListener('click', () => this.open())

    const overlay = this.shadowRoot.querySelector('.overlay')
    // Clic en el backdrop (el propio <dialog>, fuera del .modal) cierra.
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close()
    })
    overlay.addEventListener('close', () =>
      this.dispatchEvent(new CustomEvent('cc-support-close', { bubbles: true, composed: true })),
    )
    this.shadowRoot.querySelector('.close').addEventListener('click', () => this.close())

    // Burbuja "Apoya al proyecto": aparece sola al cargar (una vez por carga),
    // y también con hover sobre la moneda. Clic en la burbuja abre el modal.
    const bubble = this.shadowRoot.querySelector('.bubble')
    if (bubble) {
      bubble.addEventListener('click', () => this.open())

      // Hover: muestra la burbuja en lugar del tooltip nativo.
      const enter = () => {
        clearTimeout(this._hoverHideTimer)
        this._bubbleTimers.forEach(clearTimeout)
        this._bubbleTimers = []
        this._showBubble()
      }
      const leave = () => {
        clearTimeout(this._hoverHideTimer)
        this._hoverHideTimer = setTimeout(() => this._hideBubble(), 250)
      }
      if (trigger) {
        trigger.addEventListener('mouseenter', enter)
        trigger.addEventListener('mouseleave', leave)
      }
      bubble.addEventListener('mouseenter', enter)
      bubble.addEventListener('mouseleave', leave)

      if (!this._bubbleAutoShown) {
        this._bubbleAutoShown = true
        const timeout = parseInt(this.getAttribute('bubble-timeout') || '', 10)
        const hideAfter = Number.isFinite(timeout) ? timeout : 6000
        this._bubbleTimers.push(
          setTimeout(() => this._showBubble(), 700),
          setTimeout(() => this._hideBubble(), 700 + hideAfter),
        )
      } else if (this._bubbleVisible) {
        bubble.classList.add('show')
      }
    }
  }

  _showBubble() {
    this._bubbleVisible = true
    const bubble = this.shadowRoot.querySelector('.bubble')
    if (bubble) bubble.classList.add('show')
    // Se va si la ventana/página pierde el foco (blur).
    window.addEventListener('blur', this._onBlur)
  }

  _hideBubble() {
    this._bubbleVisible = false
    window.removeEventListener('blur', this._onBlur)
    const bubble = this.shadowRoot.querySelector('.bubble')
    if (bubble) bubble.classList.remove('show')
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
