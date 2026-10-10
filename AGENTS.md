# AGENTS.md — Cómo usar las skills de este repo

## Cómo usar una skill (regla general)

1. **La `description` solo dispara, nunca explica el flujo.** Indica *qué* y *cuándo*
   (Use when + Triggers); no resume los pasos. **Cargá la skill con el skill tool ANTES de
   actuar** — si te quedás con la description, creés que ya conocés el flujo y lo salteás
   (description-trap inversa).
2. **Leé el cuerpo entero**: `Regla` → `## Cuándo usarla` → `## Checklist de ejecución`.
3. **La Verificación es obligatoria.** El último paso del checklist de toda skill es
   `## Verificación (obligatoria)` con comandos exactos: corré esos comandos y reportá el
   resultado real. En cualquier implementación, además: lint + typecheck + tests del
   proyecto, siempre en ese orden.
4. **Si dos skills aplican**, mirá la sección `## Solapamiento` de ambas: la dueña ejecuta;
   la otra solo si su disparador es explícito en la tarea. No dupliques el flujo.
5. **Si la tarea encadena varias skills** (arranque de proyecto, UI completa, ciclo de un
   cambio), seguí la cadena en orden de `## Cadenas típicas por flujo`: cada eslabón asume
   los anteriores.
6. **Delegación por lado:** tarea de **servidor** → agente `backend-node`; de **interfaz**
   Vite/SPA → `frontend-vite`, de **interfaz Next.js** → `frontend-next`;
   **centrada en la base de datos con Drizzle** (schema, migraciones, queries e
   índices, seeds) → agente `database-drizzle` (si están instalados: aplican las
   skills de su categoría y exigen lint + typecheck + tests). Las **transversales**
   (revisión, navegador, estimaciones, changelog, tareas VS Code) se aplican en el
   agente primario con su skill directa.
7. **No reescribas el flujo de memoria.** Si la skill ordena correr un comando, corrélo;
   si pide una plantilla concreta, usá esa plantilla.

## Mapa de situaciones → skills

Buscá tu situación en las tablas y cargá la skill por `name` (= nombre de la carpeta).
Si no hay fila exacta, buscá por los triggers de la description. Categorías:
`backend/` (servidor), `frontend/` (SPA), `qa-test/` (control de calidad),
`global/` (transversales de proceso).

### Al tocar el backend

| Situación (disparador) | Skill a cargar |
|---|---|
| Estructura de carpetas, capas, "dónde va este archivo" en el servidor | `arquitectura-backend` |
| Diseñar un endpoint nuevo o cambiar el contrato de la API | `contrato-api-global` (primero) y después `validacion-entrada-backend` |
| Login, JWT, refresh, proteger rutas, hash de passwords | `autenticacion-jwt-backend` |
| Conexión a la base, pool, transacciones, migraciones | `base-datos-conexion-backend` |
| Agregar/auditar variables de entorno, `.env.example`, secretos | `config-env-backend` |
| Error 500/404, responses uniformes, controllers que lanzan | `errores-respuestas-backend` |
| Logger, niveles, health check, `console.log` en prod, logs en el repo | `logging-ops-backend` |
| Tests de API, fixtures, mocking, BD de test, CI | `testing-backend` |

### Al construir la UI (frontend)

| Situación (disparador) | Skill a cargar |
|---|---|
| Estructura de la SPA, "dónde va este archivo", dónde vive el estado, prop drilling | `arquitectura-frontend` |
| Variables `VITE_`, `.env`, secretos en el bundle | `config-env-frontend` |
| Login, guards de ruta, sesión, refresh/expiración | `auth-frontend` |
| Traer datos, caché, invalidación, optimistic updates | `data-fetching-frontend` |
| Formularios, validación Zod, errores inline, fechas | `formularios-frontend` |
| Loading/empty/error/retry, skeletons, toast | `estados-toast-frontend` |
| Paginación, tema/tokens, fechas y moneda, modal de info, espaciado/tipografía del design system | `ui-bloques-frontend` |
| Teclado, ARIA, foco, contraste, responsive | `accesibilidad-frontend` |

### Al escribir lógica o arreglar un bug

| Situación (disparador) | Skill a cargar |
|---|---|
| Lógica nueva que "tiene que estar probada" | `tdd-global` (RED → GREEN → REFACTOR) |
| Bug reportado (antes de tocar el fix) | `tdd-global` (Prove-It: reproducir en un test → arreglar) |
| El repo aún no tiene stack de tests definido | `tdd-global` (descubrir el stack primero) |

### Al revisar o limpiar código

| Situación (disparador) | Skill a cargar |
|---|---|
| Diff/PR a revisar antes de merge | `revision-codigo-global` |
| La review marcó complejidad o código enrevesado | `simplificar-codigo-global` |

### Al verificar en runtime (control de calidad)

| Situación (disparador) | Skill a cargar |
|---|---|
| Abrir la app en el navegador, navegar, click, screenshot, consola/red | `playwright-cli` |
| Generar o actualizar la colección Postman desde el código | `postman-builder` |

### Al cerrar el cambio

| Situación (disparador) | Skill a cargar |
|---|---|
| Registrar el cambio funcional en el CHANGELOG del proyecto | `changelog-global` |
| Se agregaron o alteraron endpoints de un backend | `postman-builder` (regenerar la colección) |

### Tiempos y herramientas de proyecto

| Situación (disparador) | Skill a cargar |
|---|---|
| Estimar horas de features/módulos | `generador-estimaciones-global` |
| Definir cómo se levantan los servicios dev desde VS Code | `tasks-vscode-global` |

### Al mantener este repo

| Situación (disparador) | Skill a cargar |
|---|---|
| Crear o editar una skill de este repo | `crear-skill-global` + secciones Convenciones de abajo |

## Cadenas típicas por flujo

Cada eslabón asume los anteriores; seguir el orden.

- **Backend desde cero:** `arquitectura-backend` → `config-env-backend` →
  `autenticacion-jwt-backend` → `base-datos-conexion-backend` → `validacion-entrada-backend`
  → `errores-respuestas-backend` → `logging-ops-backend` → `testing-backend`.
  Al diseñar cada endpoint, sumar `contrato-api-global`.
- **Frontend desde cero:** `arquitectura-frontend` → `config-env-frontend` → `auth-frontend`
  → `data-fetching-frontend` → `formularios-frontend` → `estados-toast-frontend` →
  `ui-bloques-frontend` → `accesibilidad-frontend`.
- **Ciclo de vida de un cambio:** `contrato-api-global` → `tdd-global` → implementación
  (skills del lado que toque) → `revision-codigo-global` → `changelog-global` →
  `postman-builder` (si hubo endpoints).
- **UI de punta a punta:** `arquitectura-frontend` → `data-fetching-frontend` →
  `formularios-frontend` → `estados-toast-frontend` → `ui-bloques-frontend` →
  `accesibilidad-frontend` → `playwright-cli` (verificar) → `changelog-global`.
- **Un bug:** `tdd-global` (reproducir en test) → corregir → `revision-codigo-global` →
  `changelog-global`.

## Qué NO hacer al usarlas

- No actuar solo con la description sin cargar la skill completa.
- No saltarte la `Verificación (obligatoria)` ni el lint + typecheck + tests.
- No inventar el flujo cuando hay una skill que lo cubre.
- No mezclar dominios: las skills `*-backend` no tocan UI; las `*-frontend` no tocan
  servidor; las de `qa-test/` se aplican en los momentos de control (runtime, API, review).
- No duplicar entre hermanas: si dos skills se pisan, manda la sección `Solapamiento`.