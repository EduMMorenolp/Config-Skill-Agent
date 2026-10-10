---
name: estados-toast-frontend
description: 'The four view states (loading/empty/error/retry) and an accessible global toast system for React SPAs. Use when a page loads data, shows no-data or error, or when adding notifications. Triggers: "loading", "skeleton", "empty state", "estado vacio", "reintentar", "toast", "notificaciones", "snackbar", "estado de error", "spinner".'
---

# Estados y Toast — toda vista de datos cubre 4 estados, todo error avisa

**Regla:** cada página que carga datos cubre **loading (skeleton) / contenido / empty / error
con retry**, y existe **un toast global accesible**; los errores de API avisán por defecto.

## Cuándo usarla

- Crear o revisar una página que consume datos.
- Agregar notificaciones/toasts al SPA.
- Una vista queda en blanco, sin feedback, o desaparece a lo brusco.

## Checklist de ejecución

### 1. Los 4 estados de toda vista con datos

1. **Loading** — skeleton/esqueleto con la forma del contenido (no spinner genérico cuando la
   forma se conoce). Loading que **bloquea la interacción** (cambio de filtro, submit) va con
   `useTransition`: la vista vieja se queda visible y el nuevo estado "pendiente" — sin
   booleano `setLoading` a mano ni parpadeo a pantalla vacía.
2. **Contenido** — la vista real.
3. **Empty state** — mensaje + acción orientativa ("No hay resultados", botón a crear).
4. **Error con retry** — mensaje claro + botón **Reintentar** (nunca vista en blanco).

- Skeleton y regiones de carga con `aria-busy="true"` (+ `aria-label` de qué carga): el lector
  de pantalla se entera de que algo carga, no solo quien mira la pantalla.

- Búsqueda/filtro sobre lista ya cargada: el input y la lista pesada con `useDeferredValue`
  (UI responsiva mientras el filtrado corre en el siguiente render).

### 2. Toast global

- Sistema **global**: stack manejado desde store/contexto de UI (`store/ui`), no estados locales
  por página.
- Variantes: `success` `error` `info` `warning`; duración configurable; **transición de salida**
  (no desaparecer de golpe).
- **Accesible:** `role="status"`/`role="alert"`, `aria-live` (polite/assertive según severidad),
  no robar el foco.
- Errores de API → toast por defecto (el interceptor/cliente los dispara), salvo errores de
  formularios que van **inline** (ver `formularios-frontend`).

### 3. Verificación (obligatoria)

```bash
# páginas con datos sin estado de error
rg "useQuery" src/ -l     # vs páginas que renderizan error/retry
# aria en los toasts
rg 'aria-live|role=\x22status\x22|role=\x22alert\x22' src/
# spinners genéricos donde cabría skeleton
rg "Spinner|loader" src/pages
# estados manuales con useEffect+useState para datos (debería ser query)
rg "useEffect" src/ -c
# loading manual con boolean donde debería ir useTransition
rg "setLoading|setIsLoading" src/
# búsqueda de lista pesada sin defer
rg "filter\(" src/ -g '!*.test.*' -l
```

Revisión funcional: en cada lista/principal — probar con API caída (error+retry), sin datos
(empty) y lenta (skeleton).

## Anti-patrones (cómo detectarlos)

| Anti-patrón | Detección |
|---|---|
| Vista en blanco ante error | página con query sin rama `isError` |
| Spinner genérico donde el contenido tiene forma conocida | `rg "<Spinner" src/pages` |
| Empty state inexistente (lista vacía = nada) | revisar render cuando `data.length === 0` |
| Toasts por página (efectos duplicados, sin stack global) | `rg "useState.*toast\|snackbar" src/pages` |
| Toast sin ARIA (inaccesible) | `rg "aria-live" src/` → sin matches |
| Auto-dismiss sin transición de salida | revisar animación de cierre del toast |
| Errores de formulario mostrados solo como toast (se va antes de leer) | errores de campo → inline, no toast |
| Booleano `setLoading` a mano en vez de `useTransition` | `rg "setLoading" src/` |
| Filtro de lista que congela el input en cada tecla | input de búsqueda sin `useDeferredValue` |

## Solapamiento

- `data-fetching-frontend` — los estados salen de las queries; los errores de API disparan toast.
- `auth-frontend` — formularios de auth usan estos estados + errores inline.
- `formularios-frontend` — definición de cuándo el error va inline vs toast.
- `ui-bloques-frontend` — tokens/variantes con los que se estilizan skeletons y toasts.
- `accesibilidad-frontend` — audita ARIA, foco y contraste del conjunto de estados + toast.
