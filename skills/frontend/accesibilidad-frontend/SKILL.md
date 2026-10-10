---
name: accesibilidad-frontend
description: 'Accesibilidad WCAG 2.1 AA y responsive mobile-first para el SPA: teclado completo, ARIA correcto, gestión de foco en modales, contraste 4.5:1, jerarquía de headings y breakpoints probados. Use when building or modifying UI, reviewing a11y, or when the interface must work with keyboard, screen readers, or small screens. Triggers: "accesibilidad", "a11y", "WCAG", "lector de pantalla", "teclado", "foco", "contraste", "responsive", "mobile first", "breakpoints", "aria-label".'
---

# Accesibilidad y Responsive — WCAG 2.1 AA + mobile-first

**Regla:** toda interfaz es usable **con teclado** y **con lector de pantalla**, con contraste
suficiente y sin scroll horizontal en mobile; lo que no se puede operar con Tab/Enter no está
terminado, aunque se vea bien.

## Cuándo usarla

- Construir o revisar componentes/páginas nuevas.
- Auditoría de a11y antes de merge o feedback de "no funciona con teclado/lectores".
- La UI se rompe en pantallas chicas o hay scroll horizontal.

## Checklist de ejecución

### 1. Teclado

- Todo elemento interactivo es focusable: **`<button>` nativo**, no `div onClick` (si no hay
  más remedio: `role="button"` + `tabIndex={0}` + Enter/Space en keydown).
- Sin keyboard traps; orden de Tab lógico (DOM = orden visual).
- `:focus-visible` visible en toda la app (definido como token, ver `ui-bloques-frontend`).

### 2. ARIA y labels

- Botón solo-icono → `aria-label="Cerrar diálogo"`.
- Input con `<label htmlFor="email">` + `id`, o `aria-label` si no hay label visible.
- Estados con roles semánticos: `role="status"` (informativo), `role="alert"` (error),
  listas con `role="list"`; regiones dinámicas con `aria-live` (ver `estados-toast-frontend`).
- No usar solo color para informar: agregar icono o texto.

### 3. Foco en modales y cambios dinámicos

- Al abrir un modal/dialog: foco **dentro** + focus trap; al cerrar: **devolver el foco** al
  botón que lo abrió.
- Actualizaciones de contenido que cambian el contexto → manejar el foco explícitamente.

### 4. Color, contraste y tipografía

- Contraste **4.5:1** texto normal, **3:1** texto grande (comprobar en devtools/eyedropper).
- Colores por tokens semánticos (`text-primary`, `bg-surface`), nunca hex crudos.
- Jerarquía `h1` (uno por página) → `h2` → `h3`; **no saltar niveles** ni usar headings
  decorativos.

### 5. Responsive mobile-first

- Diseñar de 1 columna para arriba: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.
- Probar breakpoints **320 / 768 / 1024 / 1440 px**; sin scroll horizontal; targets táctiles
  cómodos (separación, no botones pegados).

### 6. Verificación (obligatoria)

```bash
# clickeables en div/span (si hay: necesitan role+tabIndex+teclado, o usar <button>)
rg '<div[^>]*onClick|<span[^>]*onClick' src/
# inputs sin label asociado (htmlFor/aria-label debe cubrir cada <input)
rg -c '<input' src/; rg -c 'htmlFor|aria-label' src/
# botones solo-icono sin aria-label (sin matches = ok)
rg -c 'aria-label' src/
# jerarquía de headings por página
rg -n '<h[1-6]' src/pages
# breakpoints mobile-first declarados (debe ser >0)
rg -c 'sm:|md:|lg:|@media' src/
# outline eliminado sin foco visible de reemplazo (debe dar 0)
rg 'outline:\s*none|outline:\s*0' src/
```

Contraste (4.5:1) y foco real → comprobación manual en el navegador (devtools + teclado).

## Anti-patrones (cómo detectarlos)

| Anti-patrón | Detección |
|---|---|
| `div onClick` no focusable | `rg '<div[^>]*onClick' src/` |
| Botón de solo-icono sin nombre accesible | `rg -c 'aria-label' src/` bajo vs botones |
| Modal sin focus trap ni devolución del foco | `rg 'role=\x22dialog\x22' src/` sin manejo de foco |
| `outline: none` sin reemplazo visible | `rg 'outline:\s*none' src/` |
| Contraste bajo (gris sobre blanco) | revisar tokens en devtools |
| Solo color como información (ej. campo inválido solo en rojo) | error sin texto/icono |
| Pantalla en blanco ante estado vacío/error | ver `estados-toast-frontend` |
| Solo desktop: sin breakpoints o scroll horizontal | `rg -c 'sm:\|md:\|lg:' src/` → 0 |

## Solapamiento

- `ui-bloques-frontend` — token `:focus-visible` y `prefers-reduced-motion` viven ahí; esta skill exige que existan.
- `estados-toast-frontend` — empty/error/toast ya traen `aria-live`/roles; acá se audita el conjunto.
- `formularios-frontend` — labels e `htmlFor` y errores inline asociados (`aria-describedby`).
- `arquitectura-frontend` — dónde vive cada componente que se audita.
