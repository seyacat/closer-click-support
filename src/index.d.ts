export interface SupportLink {
  label?: string
  href: string
}

/**
 * Custom element `<closer-click-support>`: modal de soporte autohosteado,
 * reutilizable por cualquier app del ecosistema Closer Click. Sin JS de
 * terceros ni cookies.
 */
export declare class CloserClickSupport extends HTMLElement {
  /** Abre el modal y emite 'cc-support-open'. */
  open(): void
  /** Cierra el modal y emite 'cc-support-close'. */
  close(): void
}

declare global {
  interface HTMLElementTagNameMap {
    'closer-click-support': CloserClickSupport
  }
}

export default CloserClickSupport
