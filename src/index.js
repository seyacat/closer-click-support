/**
 * @closerclick/closer-click-support
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
 *   import '@closerclick/closer-click-support'
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
    hint: 'Donar/Compartir',
    shareHeading: 'Compartir',
    shareText: '¡Mira esto!',
    copied: '¡Enlace copiado!',
    reportBug: 'Reporta un error',
    discord: 'Canal de Soporte',
    share: {
      whatsapp: 'WhatsApp',
      x: 'X',
      facebook: 'Facebook',
      instagram: 'Instagram',
    },
  },
  en: {
    cta: 'Support',
    heading: 'Support the project',
    message:
      'If you find this tool useful, you can make a small contribution. The Closer Click ecosystem apps are free and self-hosted. Thank you!',
    close: 'Close',
    defaultLink: 'Donate',
    hint: 'Donate/Share',
    shareHeading: 'Share',
    shareText: 'Check this out!',
    copied: 'Link copied!',
    reportBug: 'Report a bug',
    discord: 'Support channel',
    share: {
      whatsapp: 'WhatsApp',
      x: 'X',
      facebook: 'Facebook',
      instagram: 'Instagram',
    },
  },
}

// Iconos de marca (SVG inline, sin JS de terceros). Heredan color con fill.
const SHARE_ICONS = {
  share:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>',
  whatsapp:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.519 5.26l-.999 3.648 3.969-1.018zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
  facebook:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
  instagram:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>',
}

// Icono de bug (SVG inline, sin JS de terceros). Hereda color con fill.
const BUG_ICON =
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5c-.49 0-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z"/></svg>'

// Icono de Discord (SVG inline, sin JS de terceros). Hereda color con fill.
const DISCORD_ICON =
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>'

const SHARE_COLORS = {
  whatsapp: '#25D366',
  x: '#000000',
  facebook: '#1877F2',
  instagram: '#E4405F',
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

  /* Moneda: elemento integrado (no flotante). La app la ubica arriba a la derecha.
     Tarjeta 3D que rota mostrando dos caras: moneda (donar) e icono de compartir. */
  .trigger.coin {
    display: block;
    padding: 0;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: transparent;
    border: none;
    line-height: 0;
    perspective: 600px;
    transition: transform 0.2s ease;
  }
  .trigger.coin:hover { transform: translateY(-1px) scale(1.08); }
  .trigger.coin:hover .flipper { animation-play-state: paused; }

  .flipper {
    display: block;
    position: relative;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
    animation: cc-flip 7.2s ease-in-out infinite;
  }
  @keyframes cc-flip {
    0%   { transform: rotateY(0deg); }
    43%  { transform: rotateY(0deg); }
    50%  { transform: rotateY(180deg); }
    93%  { transform: rotateY(180deg); }
    100% { transform: rotateY(360deg); }
  }
  /* Con cara de bug habilitada: 3 caras (moneda → compartir → bug) repartidas
     a 120° en el mismo plano; la animación se detiene en cada una. */
  .flipper.three { animation-name: cc-flip3; }
  @keyframes cc-flip3 {
    0%   { transform: rotateY(0deg); }
    27%  { transform: rotateY(0deg); }
    36%  { transform: rotateY(-120deg); }
    60%  { transform: rotateY(-120deg); }
    69%  { transform: rotateY(-240deg); }
    93%  { transform: rotateY(-240deg); }
    100% { transform: rotateY(-360deg); }
  }
  @media (prefers-reduced-motion: reduce) {
    .flipper { animation: none; }
  }

  .face {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    overflow: hidden;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.35);
  }
  .face.front img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: contain;
    pointer-events: none;
  }
  /* Caras con icono (compartir / bug). El transform de rotación va inline
     porque depende de si hay 2 o 3 caras. */
  .face.icon {
    background: #3498db;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .face.icon svg {
    width: 56%;
    height: 56%;
    color: #fff;
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

  .heading { font-size: 1.4rem; font-weight: 700; margin: 0 0 1.1rem; color: #3498db; }
  .message { font-size: 0.98rem; line-height: 1.6; margin: 0 0 1.5rem; opacity: 0.92; }

  .links { display: flex; flex-direction: column; align-items: center; gap: 0.6rem; }
  .link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    min-width: 220px;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.95rem;
    padding: 0.7rem 1.4rem;
    border-radius: 50px;
    background: #3498db;
    color: #fff;
    transition: all 0.25s ease;
    box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
  }
  .link:hover { background: #2980b9; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4); }
  .link-ico { display: inline-flex; width: 1.4rem; height: 1.4rem; }
  .link-ico img { width: 100%; height: 100%; display: block; object-fit: contain; }

  /* Sección de compartir */
  .share {
    margin-top: 1.5rem;
    padding-top: 1.25rem;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
  }
  .share-heading {
    font-size: 0.95rem;
    font-weight: 700;
    margin: 0 0 0.9rem;
    opacity: 0.92;
  }
  .share-list {
    display: flex;
    justify-content: center;
    gap: 0.9rem;
    flex-wrap: wrap;
  }
  .share-btn {
    width: 46px;
    height: 46px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    text-decoration: none;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    padding: 0;
  }
  .share-btn:hover { transform: translateY(-3px); box-shadow: 0 7px 18px rgba(0, 0, 0, 0.4); }
  .share-btn svg { width: 50%; height: 50%; }
  .share-copied {
    margin: 0.85rem 0 0;
    font-size: 0.85rem;
    font-weight: 600;
    color: #2ecc71;
    height: 1.1rem;
    opacity: 0;
    transition: opacity 0.25s ease;
  }
  .share-copied.show { opacity: 1; }

  /* Sección "Reporta un error": enlace discreto a los issues del repo */
  .bug {
    margin-top: 1.25rem;
    padding-top: 1.1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
  }
  .bug-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: rgba(255, 255, 255, 0.7);
    text-decoration: none;
    font-size: 0.9rem;
    font-weight: 600;
    transition: color 0.2s ease;
  }
  .bug-link:hover { color: #fff; }
  .bug-ico {
    display: inline-flex;
    width: 1.15rem;
    height: 1.15rem;
  }
  .bug-ico svg { width: 100%; height: 100%; display: block; }

  /* Sección de comunidad/soporte: enlace a Discord (marca #5865F2) */
  .discord {
    margin-top: 1.25rem;
    padding-top: 1.1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
  }
  .discord-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    min-width: 220px;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.95rem;
    padding: 0.7rem 1.4rem;
    border-radius: 50px;
    background: #5865f2;
    color: #fff;
    transition: all 0.25s ease;
    box-shadow: 0 4px 15px rgba(88, 101, 242, 0.35);
  }
  .discord-link:hover {
    background: #4752c4;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(88, 101, 242, 0.45);
  }
  .discord-ico { display: inline-flex; width: 1.4rem; height: 1.4rem; }
  .discord-ico svg { width: 100%; height: 100%; display: block; }
`

class CloserClickSupport extends HTMLElement {
  static get observedAttributes() {
    return ['href', 'links', 'cta', 'no-trigger', 'heading', 'message', 'lang', 'variant', 'inline', 'hint', 'coin', 'no-bubble', 'bubble-timeout', 'share-url', 'share-text', 'no-share', 'repo', 'bug-href', 'discord']
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
    clearTimeout(this._copiedTimer)
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

  /* ---- compartir ---- */
  // URL a compartir: por defecto la URL completa de la página actual (incluye el
  // #fragment con el contenido del usuario, que nunca llega al servidor).
  get _shareUrl() {
    const attr = this.getAttribute('share-url')
    if (attr) return attr
    try {
      return window.location.href
    } catch {
      return ''
    }
  }

  /* ---- reportar error ---- */
  // URL a los issues del repositorio correspondiente. Se configura con:
  //   bug-href="https://github.com/usuario/repo/issues"  (URL completa), o
  //   repo="usuario/repo"  (atajo GitHub) o repo="https://github.com/usuario/repo".
  get _bugHref() {
    const explicit = this.getAttribute('bug-href')
    if (explicit) return explicit.trim()
    const repo = (this.getAttribute('repo') || '').trim()
    if (!repo) return ''
    if (/^https?:\/\//i.test(repo)) return repo.replace(/\/+$/, '') + '/issues'
    return `https://github.com/${repo.replace(/^\/+|\/+$/g, '')}/issues`
  }

  /* ---- comunidad ---- */
  // Enlace a Discord (u otra comunidad). Se configura con discord="https://discord.gg/...".
  get _discordHref() {
    return (this.getAttribute('discord') || '').trim()
  }

  get _shareText() {
    return this.getAttribute('share-text') || this._t.shareText
  }

  // Construye los enlaces de compartir para cada red. Instagram no admite
  // compartir una URL por web, así que su acción copia el enlace al portapapeles.
  _shareTargets() {
    const url = this._shareUrl
    const u = encodeURIComponent(url)
    const text = encodeURIComponent(this._shareText)
    return [
      { key: 'whatsapp', href: `https://wa.me/?text=${text}%20${u}` },
      { key: 'x', href: `https://twitter.com/intent/tweet?url=${u}&text=${text}` },
      { key: 'facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
      { key: 'instagram', href: null }, // copia al portapapeles
    ]
  }

  _copyShareUrl() {
    const url = this._shareUrl
    const done = () => this._flashCopied()
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, () => this._copyFallback(url, done))
      } else {
        this._copyFallback(url, done)
      }
    } catch {
      this._copyFallback(url, done)
    }
  }

  _copyFallback(text, done) {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      done()
    } catch {
      /* sin portapapeles disponible */
    }
  }

  _flashCopied() {
    const el = this.shadowRoot.querySelector('.share-copied')
    if (!el) return
    el.classList.add('show')
    clearTimeout(this._copiedTimer)
    this._copiedTimer = setTimeout(() => el.classList.remove('show'), 2000)
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
    const bugHref = this._bugHref
    const discordHref = this._discordHref

    // Trigger por defecto: moneda flotante arriba a la derecha (hint "Apoya el Proyecto").
    // Con `inline` se usa un botón de texto (cta/variant) en el flujo del documento.
    // La burbuja solo acompaña a la moneda flotante (no al botón inline).
    const wantsBubble = hasTrigger && !inline && !this.hasAttribute('no-bubble')

    // Caras del flipper: moneda (front) + compartir, y bug si está configurado.
    // Con 3 caras se reparten a 120°; con 2, la cara de compartir va a 180°.
    const iconFaces = bugHref
      ? `<span class="face icon" style="transform: rotateY(120deg)">${SHARE_ICONS.share}</span>` +
        `<span class="face icon" style="transform: rotateY(240deg)">${BUG_ICON}</span>`
      : `<span class="face icon" style="transform: rotateY(180deg)">${SHARE_ICONS.share}</span>`
    const flipperClass = bugHref ? 'flipper three' : 'flipper'

    const triggerHtml = !hasTrigger
      ? ''
      : inline
        ? `<button type="button" class="trigger ${variant}" part="trigger" title="${escapeAttr(hint)}" aria-label="${escapeAttr(hint)}">${escapeHtml(cta)}</button>`
        : `<button type="button" class="trigger coin" part="trigger" aria-label="${escapeAttr(hint)}"><span class="${flipperClass}"><span class="face front"><img src="${escapeAttr(coinSrc)}" alt="" /></span>${iconFaces}</span></button>`

    const bubbleHtml = wantsBubble
      ? `<div class="bubble" part="bubble" role="status">${escapeHtml(hint)}</div>`
      : ''

    const linksHtml = links
      .map(
        (l) =>
          `<a class="link" href="${escapeAttr(l.href)}" target="_blank" rel="noopener noreferrer"><span class="link-ico"><img src="${escapeAttr(
            coinSrc,
          )}" alt="" /></span>${escapeHtml(l.label)}</a>`,
      )
      .join('')

    const wantsShare = !this.hasAttribute('no-share')
    const shareHtml = wantsShare
      ? `<div class="share" part="share">
          <p class="share-heading">${escapeHtml(t.shareHeading)}</p>
          <div class="share-list">${this._shareTargets()
            .map((s) =>
              s.href
                ? `<a class="share-btn" part="share-btn" href="${escapeAttr(s.href)}" target="_blank" rel="noopener noreferrer" style="background:${SHARE_COLORS[s.key]}" aria-label="${escapeAttr(t.share[s.key])}" title="${escapeAttr(t.share[s.key])}">${SHARE_ICONS[s.key]}</a>`
                : `<button type="button" class="share-btn" part="share-btn" data-share="${s.key}" style="background:${SHARE_COLORS[s.key]}" aria-label="${escapeAttr(t.share[s.key])}" title="${escapeAttr(t.share[s.key])}">${SHARE_ICONS[s.key]}</button>`,
            )
            .join('')}</div>
          <p class="share-copied" part="share-copied" role="status">${escapeHtml(t.copied)}</p>
        </div>`
      : ''

    const discordHtml = discordHref
      ? `<div class="discord" part="discord">
          <a class="discord-link" part="discord-link" href="${escapeAttr(discordHref)}" target="_blank" rel="noopener noreferrer">
            <span class="discord-ico">${DISCORD_ICON}</span>${escapeHtml(t.discord)}
          </a>
        </div>`
      : ''

    const bugHtml = bugHref
      ? `<div class="bug" part="bug">
          <a class="bug-link" part="bug-link" href="${escapeAttr(bugHref)}" target="_blank" rel="noopener noreferrer">
            <span class="bug-ico">${BUG_ICON}</span>${escapeHtml(t.reportBug)}
          </a>
        </div>`
      : ''

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
          ${shareHtml}
          ${discordHtml}
          ${bugHtml}
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

    // Compartir: el botón sin href (Instagram) copia el enlace al portapapeles.
    this.shadowRoot.querySelectorAll('.share-btn[data-share]').forEach((btn) => {
      btn.addEventListener('click', () => this._copyShareUrl())
    })

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
