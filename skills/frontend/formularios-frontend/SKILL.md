---
name: formularios-frontend
description: 'Form handling and validation (Zod) for React SPAs, synced with the API contract, with inline errors and trap patterns. Use when building forms, validating input, handling submit/errors, or fixing date/range fields. Triggers: "formularios", "validacion", "zod", "errores inline", "submit", "campos controlados", "fechas rango", "schema del formulario".'
---

# Formularios Frontend — validación Zod sincronizada con el contrato

**Regla:** todo formulario valida con **Zod** alineado al contrato del backend, muestra errores
**inline** por campo y maneja submit/carga de forma consistente.

## Cuándo usarla

- Crear o refactorizar un formulario.
- La validación está duplicada, dispersa o diverge del backend.
- Errores que no se muestran, se pierden o llegan solo como toast.

## Checklist de ejecución

1. **Schema Zod por formulario** junto al formulario (`<form>.schema.ts`), reflejando el
   contrato del endpoint (campos, tipos, requeridos). Si el backend cambia el contrato, se
   cambia el schema en la misma tarea.
2. **Errores inline por campo**: mensaje bajo cada campo (`aria-describedby` + `aria-invalid`);
   errores de negocio del backend (409, reglas) también inline en el campo o formulario
   relacionado — **no solo toast** (el toast se va antes de leerlo).
3. **Validar en blur, no en cada tecla**: mostrar el error del campo cuando sale el foco
   (`touched`), no al primer carácter — el usuario ve el error cuando ya terminó de tipear,
   no cuando empieza. Validación en submit para el resto.
4. **Atributos nativos reales**: `autoComplete` honesto según el campo (`name`, `email`,
   `current-password`, `new-password`, `tel`, `street-address`) — el navegador autocompleta
   y el asistente de contraseñas funciona; `inputMode="numeric|decimal|email"` en teclados
   móviles sin bloquear el carácter a mano; `type` correcto (`tel`, `email`, `number`).
   Foco inicial en el primer campo del formulario (login → email).
5. **Submit consistente**: botón deshabilitado mientras envía, doble submit bloqueado,
   valores no perdidos al fallar.
6. **Patrones con trampa:**
   - **Rangos de fechas**: validar `min ≤ max` en el schema (`.refine`) y, si hay datepicker,
     pasar `minDate`/`maxDate` para que la UI no permita lo inválido.
   - Fechas en formato local vs ISO: parsear/serializar en un solo lugar (helper), no en cada
     campo; cuidar zona horaria.
   - Campos numéricos: distinguir string del input del número validado (coerción de Zod).
   - Selects con "vacío" inicial: un valor sentinela explícito, no `""` que pasa por-default.
7. **Campos controlados de forma consistente**: un patrón en todo el repo (controlled + state
   del form), no mezclar controlado/descontrolado por formulario.
8. **Verificación (obligatoria):**

   ```bash
   # schemas Zod presentes
   rg "\.schema\.ts" src/ -l   # o rg "z\.object" src/
   # errores solo en toast y no inline
   rg "aria-invalid|aria-describedby" src/ -c
   # validación manual duplicada fuera de Zod
   rg "if \(.*\.value\s*===\s*''" src/components
   # doble submit sin bloqueo (bloqueos ≥ submits)
   rg "onSubmit" src/ -c
   rg "isSubmitting|disabled=\{" src/ -c
   # inputs sin autoComplete (formularios con campos de identidad/credenciales)
   rg "<input" src/ -g '!*.test.*' -c
   rg "autoComplete" src/ -c
   # validación en cada keystroke (onChange) sin touched/blur
   rg "onChange.*setErrors|validate.*onChange" src/
   ```

## Anti-patrones (cómo detectarlos)

| Anti-patrón | Detección |
|---|---|
| Validación solo en el submit o con `if` sueltos | `rg "e\.preventDefault" src/` + chequeos ad-hoc |
| Schema divergiendo del backend (acepta lo que el API rechaza) | comparar schema del form vs contrato del endpoint |
| Error de negocio mostrado solo como toast | `rg "toast.*error" src/` sin error inline en el campo |
| Rango de fechas invertido permitido por la UI | datepicker sin `minDate`/`maxDate` |
| Fecha +1 día por zona horaria en la serialización | parse/serialize dispersos: `rg "new Date\(" src/` |
| Doble envío (doble click = doble registro) | submit sin bloqueo `disabled/isSubmitting` |
| Campos no controlados que pierden valores en error | probar fallo de red y revisar que el form conserva lo tipeado |
| Input de email/contraseña sin `autoComplete` (sin autofill ni gestor de contraseñas) | `rg -e 'type=\x22email\x22' -e 'type=\x22password\x22' src/ -l` vs `rg "autoComplete" src/` |
| Errores que parpadean con cada tecla (validación en `onChange`) | `rg "onChange" src/` con validación dentro sin `touched`/blur |

## Solapamiento

- `data-fetching-frontend` — el submit es una **mutation**; sus errores van a inline/estado.
- `estados-toast-frontend` — define cuándo el error va toast (global) vs inline (campo).
- `auth-frontend` — formularios de login/registro/recuperación aplican este flujo.
- `ui-bloques-frontend` — tokens y helpers de formato (fechas/moneda) compartidos.
