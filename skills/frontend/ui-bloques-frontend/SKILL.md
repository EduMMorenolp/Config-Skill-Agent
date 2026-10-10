---
name: ui-bloques-frontend
description: 'Transversal UI blocks for React SPAs: pagination synced to URL, design tokens/theme, design-system adherence (anti AI-aesthetic), Intl locale helpers, and info modal (changelog + manual). Use when adding lists, theming, date/currency formatting, help/changelog UI, or reviewing spacing/typography against the design system. Triggers: "paginacion", "scroll infinito", "design tokens", "tema oscuro", "formato de fechas", "moneda", "changelog en la app", "manual de uso", "modal de informacion", "design system", "espaciado", "tipografia", "aesthetic".'
---

# UI Bloques — los bloques transversales que todo SPA trae una vez

**Regla:** paginación con estado en URL, tokens como única fuente de verdad, formateo `Intl`
central y el icono "i" con changelog + manual — implementados **una vez**, reutilizados.

## Cuándo usarla

- Crear un listado multi-página o scroll infinito.
- Agregar colores/tema o detectar valores hardcodeados.
- Formatear fechas/dinero/números en varias pantallas.
- Agregar changelog o manual dentro de la app.

## Checklist de ejecución

### 1. Paginación / scroll

- Listados: **paginación** (`< 1 2 3 >`) o scroll infinito **consistente** (uno por app).
- Scroll infinito solo si el backend soporta offset/contador; si no, paginación.
- **Estado de página sincronizado a la URL** (query param `?page=`): compartible y
  sobrevive al reload. Restaurar al entrar.
- **Resultado del listado anunciado**: región `aria-live="polite"` con el resumen
  ("12 resultados, página 2 de 5") — al cambiar de página/filtrar, lectores de pantalla
  se enteran sin mover el foco.

### 2. Design tokens + tema

- Tokens (color, spacing, typography, radius, shadow) en un solo archivo/objeto — única
  fuente de verdad.
- Tema claro/oscuro **por token** (variable/objeto temático), nunca `#000` suelto.
- **Prohibido** colores/valores hardcodeados fuera de tokens.
- **`:focus-visible` es un token**: estilo de foco visible definido con el resto (nunca
  `outline: none` sin reemplazo) — el foco de teclado se ve en toda la app.
- **`prefers-reduced-motion`**: respetar la media query desactivando/encurtiendo
  transiciones y animaciones no esenciales; las transiciones de UI (modal, toast) van por
  token de duración, no valores sueltos.
- **Adherencia al design system — anti "aesthetic AI"** (la UI genérica de IA tiene estética
  reconocible; ninguna entra al repo):

| Señal de IA genérica | En su lugar |
|---|---|
| Paleta morada/índigo en todo | la paleta real del proyecto (los tokens existentes) |
| Gradientes por todos lados | planos, o gradiente sutil solo si el DS lo define |
| `rounded-2xl`/`rounded-full` en todo | escala de radios del DS (jerarquía real) |
| Hero genérico a pantalla completa | layout según el contenido real |
| Padding sobredimensionado e igual en todo | escala de spacing del DS (jerarquía visual) |
| Sombras en capas compitiendo con el contenido | sutil o ninguna, la que diga el DS |

- **Escala de spacing**: solo valores de la escala del DS (múltiplos de 0.25rem); prohibido
  inventar `13px`, `2.3rem`.
- **Tipografía**: `h1` (uno por página) → `h2` → `h3` → body → small; no saltar niveles ni
  usar estilo de heading para contenido decorativo (cruce con `accesibilidad-frontend`).

### 3. Formateo de locales

- Helper central con la API `Intl` del navegador: fechas, moneda, números.
- Ningún componente formatea a mano (`toLocaleString` suelto repetido).

### 4. Icono "i": changelog + manual

- Icono de información en la **barra superior** (topbar), junto a controles globales.
- Abre **modal accesible**: cierra con `Escape`, clic en `×`/backdrop, focus trap y devolución
  del foco al botón.
- Contenido en módulo de datos (`info.ts`: `APP_VERSION`, `CHANGELOG`, `MANUAL`); el modal
  solo presenta — datos separados de presentación.
- Mantener el changelog del app alineado con el changelog del repo.

### 5. Verificación (obligatoria)

```bash
# colores/valores hardcodeados fuera de tokens
rg "#[0-9a-fA-F]{3,8}\b|rgba?\(" src/ -g '!src/styles/**'
# formateo disperso en vez del helper Intl
rg "toLocaleDateString|toLocaleString|Intl\." src/ -g '!src/lib/**' -g '!src/utils/**'
# página de listado sin sync a URL
rg "searchParams|useSearchParams" src/pages
# accesibilidad del modal de info
rg 'aria-modal|role=\x22dialog\x22|Escape' src/components
# outline eliminado sin foco visible de reemplazo
rg "outline:\s*none|outline:\s*0" src/ -g '!src/styles/**'
# transiciones sin respetar reduced-motion (sin matches = falta)
rg "prefers-reduced-motion" src/
# listados dinámicos sin anuncio a lectores de pantalla (sin matches = falta)
rg "aria-live" src/ -c
# spacing fuera de escala en componentes (debe dar 0)
rg "padding:\s*[0-9]+px|margin(-[a-z]+)?:\s*[0-9]+px" src/ -g '!src/styles/**'
# gradientes decorativos fuera del DS (revisar cada match)
rg "linear-gradient" src/ -g '!src/styles/**'
```

## Anti-patrones (cómo detectarlos)

| Anti-patrón | Detección |
|---|---|
| Colores hardcodeados en componentes | `rg "#[0-9a-fA-F]{3,8}" src/components` |
| Página sin estados de la paginación en la URL | listado con `useState` de página y sin `useSearchParams` |
| Scroll infinito sin soporte de offset en el backend | revisar contrato del listado |
| Fechas/monedas formateadas distinto en cada pantalla | `rg "toLocaleString" src/` con formatos distintos |
| Changelog hardcodeado dentro del JSX del modal | `rg "CHANGELOG" src/` → datos en módulo, no en componente |
| Modal sin `Escape`/focus trap | `rg 'role=\x22dialog\x22' src/` sin manejo de teclado |
| `outline: none` sin foco visible de reemplazo | `rg "outline:\s*none" src/` |
| Animaciones ignorando `prefers-reduced-motion` | `rg "prefers-reduced-motion" src/` → sin matches |
| Cambio de página sin anuncio a lectores de pantalla | `rg "aria-live" src/` solo en toasts, no en listados |
| Estética "AI" (paleta morada, gradientes, redondeo máximo) | `rg "linear-gradient" src/ -g '!src/styles/**'` + revisar paleta |
| Spacing fuera de escala (`13px`, `2.3rem`) | `rg "padding:\s*[0-9]+px\|margin(-[a-z]+)?:\s*[0-9]+px" src/` |
| Saltos de jerarquía de headings (`h1` → `h3`) | `rg -n "<h[1-6]" src/pages` (orden por página) |

## Solapamiento

- `estados-toast-frontend` — skeletons/empty/error comparten tokens y variantes del tema.
- `formularios-frontend` — inputs y errores comparten tokens y helpers de formato.
- `arquitectura-frontend` — `styles/` y el módulo `info.ts` viven donde dice la estructura.
- `accesibilidad-frontend` — audita que los tokens de foco/contraste que se definen acá existan realmente.
