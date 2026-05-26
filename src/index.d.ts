export interface SupportLink {
  label?: string
  href: string
}

/**
 * Custom element `<closer-click-support>`: modal de soporte autohosteado,
 * reutilizable por cualquier app del ecosistema Closer Click. Sin JS de
 * terceros ni cookies.
 *
 * Atributos para "Reporta un error" (opcional): `repo` ("usuario/repo" o URL
 * completa del repo) o `bug-href` (URL completa a los issues). Si alguno está
 * presente, se añade una cara de bug al flipper y una sección al modal con un
 * enlace directo a la página de issues del repositorio.
 *
 * Atributo `discord` (opcional): URL de invitación a Discord (p. ej.
 * "https://discord.gg/xxxx"). Si está presente, el modal muestra una sección
 * de comunidad con un enlace a Discord.
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
