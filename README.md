# @gatoseya/closer-click-support

Web Component (`<closer-click-support>`) con un **modal de soporte/donaciones**
reutilizable por **cualquier app del ecosistema Closer Click**: las hechas en
Vue 3 y las vanilla (HTML/JS), porque es un *custom element* estándar.

## Filosofía (importante)

Cumple la regla de Closer Click: **no carga JS de terceros ni setea cookies**.
El modal es 100 % autohosteado (Shadow DOM). Lo único externo es el **enlace de
salida** (Ko-fi, PayPal, etc.) que el usuario abre explícitamente en una pestaña
nueva. No hay widget de terceros, ni pixel, ni tracking.

## Comportamiento por defecto

El trigger por defecto es la **moneda dorada del ecosistema** (embebida como
data-URI en el propio módulo — no hay que copiar ningún archivo) fija **arriba a
la derecha** de la app. Es la presentación estándar para **todas** las apps del
ecosistema. Con el atributo `inline` se usa en su lugar un botón de texto en el
flujo del documento.

Al cargar la página aparece sola una **burbuja de diálogo "Apoya al proyecto"**
apuntando a la moneda; se oculta a los ~6 s, al abrir el modal, o cuando la
ventana pierde el foco (`blur`). Se desactiva con `no-bubble`.

El texto de la moneda y la burbuja es **bilingüe es/en** automático (detecta
`<html lang>` o el idioma del navegador; o pasale `lang="es"|"en"`).

## Instalación

```bash
npm install @gatoseya/closer-click-support
```

## Uso

### Vanilla (HTML/JS — qrshare, ecuavoley, padel…)

```html
<script type="module" src="/node_modules/@gatoseya/closer-click-support/src/index.js"></script>

<closer-click-support href="https://ko-fi.com/tuusuario"></closer-click-support>
```

### Vue 3 (closerclick, messenger, mundial, chat, chess, gridgame, favicon)

```js
// en main.ts
import '@gatoseya/closer-click-support'
```

```vue
<closer-click-support href="https://ko-fi.com/tuusuario" lang="auto" />
```

> Si tu build de Vue se queja del tag desconocido, marcá el custom element en
> `vite.config.ts`:
> ```ts
> vue({ template: { compilerOptions: { isCustomElement: (t) => t === 'closer-click-support' } } })
> ```

## API

### Atributos

| Atributo     | Descripción |
|--------------|-------------|
| `href`       | URL de soporte única (p. ej. `https://ko-fi.com/usuario`). |
| `links`      | JSON con uno o varios enlaces: `'[{"label":"Ko-fi","href":"…"},{"label":"PayPal","href":"…"}]'`. Tiene prioridad sobre `href`. |
| `inline`     | Si está presente, usa botón de texto en el flujo en vez de la moneda flotante. |
| `hint`       | Texto del tooltip/`title` del trigger y de la burbuja. Default `"Apoya al proyecto"` / `"Support the project"`. |
| `coin`       | URL de imagen para reemplazar la moneda por defecto. |
| `no-bubble`  | Desactiva la burbuja de diálogo automática. |
| `bubble-timeout` | Ms que la burbuja queda visible antes de ocultarse sola (default `6000`). |
| `cta`        | Texto del botón disparador (solo modo `inline`). Default según idioma. |
| `no-trigger` | Si está presente, no renderiza trigger; abrís el modal con `el.open()`. |
| `heading`    | Título del modal (override). |
| `message`    | Cuerpo del modal (override). |
| `lang`       | `es` \| `en` \| `auto` (default `auto`: usa `<html lang>` o el idioma del navegador). |
| `variant`    | `solid` (default) \| `ghost` — estilo del botón en modo `inline`. |

Si no pasás `label` en un enlace, se deriva del dominio (Ko-fi, PayPal, Patreon,
GitHub Sponsors) o cae al texto por defecto del idioma.

### Métodos

- `el.open()` — abre el modal.
- `el.close()` — lo cierra.

### Eventos

- `cc-support-open` y `cc-support-close` (`bubbles`, `composed`).

### Disparar desde tu propio botón

```html
<closer-click-support id="sup" no-trigger href="https://ko-fi.com/tuusuario"></closer-click-support>
<button onclick="document.getElementById('sup').open()">☕ Invitame un café</button>
```

### Estilos

El modal vive en Shadow DOM (aislado). Para retoques expone `part`s:
`::part(trigger)` y `::part(modal)`.

## Licencia

MIT
