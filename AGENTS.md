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
   proyecto, siempre en ese orden. Cuando el cambio toque skills o agentes **de este repo**,
   la suite propia es `npm test` en la raíz (estructura + triggers + sincronización):
   correla y reportá el resultado real.
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
8. **Antes de instalar una dependencia, verificá la versión estable más reciente.**
   Consultá el registro (`npm view <pkg> version`, `pip index versions <pkg>`, etc.) o la
   web oficial y usá esa versión; no asumas la que dicen la memoria, un tutorial o un
   ejemplo. Si necesitás una versión anterior por compatibilidad, dejalo explícito.

## Mapa de situaciones → skills

Buscá tu situación en las tablas y cargá la skill por `name` (= nombre de la carpeta).
Si no hay fila exacta, buscá por los triggers de la description. Categorías:
`backend-node/` (servidor Node/Express), `frontend-vite/` (SPA Vite/React),
`frontend-next/` (Next.js App Router), `qa-test/` (control de calidad),
`documentacion/` (documentos ejecutivos de features), `global/` (transversales de proceso).

### Al arrancar un trabajo (ramas y paralelismo)

| Situación (disparador) | Skill a cargar |
|---|---|
| Arrancar trabajo en un repo, working tree sucio, dos agentes o tareas en paralelo, decidir en qué rama va un cambio, antes de mergear o liberar | `git-workflow-global` |

### Al tocar el backend (Node/Express)

| Situación (disparador) | Skill a cargar |
|---|---|
| Estructura de carpetas, capas, "dónde va este archivo" en el servidor | `node-arquitectura-backend` |
| Diseñar un endpoint nuevo o cambiar el contrato de la API | `contrato-api-global` (primero) y después `node-validacion-entrada-backend` |
| Login, JWT, refresh, proteger rutas, hash de passwords | `node-autenticacion-jwt-backend` |
| Conexión a la base, pool, transacciones, migraciones | `node-base-datos-conexion-backend` |
| Estructura de la capa `db/` con Drizzle: schemas, seed, migraciones, "un archivo por tabla" | `arquitectura-drizzle-backend` |
| Agregar/auditar variables de entorno, `.env.example`, secretos | `node-config-env-backend` |
| Error 500/404, responses uniformes, controllers que lanzan | `node-errores-respuestas-backend` |
| Logger, niveles, health check, `console.log` en prod, logs en el repo | `node-logging-ops-backend` |
| Tests de API, fixtures, mocking, BD de test, CI | `node-testing-backend` |

### Al construir la UI (frontend)

Cada tema tiene **dos skills**: una por stack. Cargar la del stack del proyecto (los dos no
conviven en la misma app).

| Situación (disparador) | Vite / SPA | Next.js App Router |
|---|---|---|
| Estructura, "dónde va este archivo", dónde vive el estado, prop drilling | `vite-arquitectura-frontend` | `next-arquitectura-frontend` |
| Variables de entorno, `.env`, secretos en el bundle | `vite-config-env-frontend` (`VITE_`) | `next-config-env-frontend` (`NEXT_PUBLIC_`, server-only) |
| Login, guards de ruta, sesión, refresh/expiración | `vite-auth-frontend` | `next-auth-frontend` |
| Traer datos, caché, invalidación, optimistic updates | `vite-data-fetching-frontend` | `next-data-fetching-frontend` |
| Formularios, validación Zod, errores inline, fechas | `vite-formularios-frontend` | `next-formularios-frontend` |
| Loading/empty/error/retry, skeletons, toast | `vite-estados-toast-frontend` | `next-estados-toast-frontend` |
| Paginación, tema/tokens, fechas y moneda, modal de info, espaciado/tipografía del design system | `vite-ui-bloques-frontend` | `next-ui-bloques-frontend` |
| Teclado, ARIA, foco, contraste, responsive | `vite-accesibilidad-frontend` | `next-accesibilidad-frontend` |

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

### Al diagramar o documentar un sistema

| Situación (disparador) | Skill a cargar |
|---|---|
| "diagrama de arquitectura", "cómo se conecta", mapear un flujo/llamada/dataflow/estados, convertir Mermaid a un diagrama lindo | `archify` |

### Al presentar o documentar una feature

| Situación (disparador) | Skill a cargar |
|---|---|
| "documento de presentación", "presentar feature/implementación", "documento para el rol X", "briefing de feature", "uno con detalle técnico y otro sin jerga", "documento con fecha YYYYMMDD" | `documentacion` |

### Al arrancar o documentar un proyecto

| Situación (disparador) | Skill a cargar |
|---|---|
| "documentación del proyecto", "acta de constitución", "alcance del proyecto", "objetivos SMART", "ERS", "EDT", "WBS", "cronograma de hitos", "matriz RACI", "plan de riesgos", "set de documentos", "PMBOK" | `documentacion-proyecto-global` |

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

## Cómo agregar un stack nuevo (backend o frontend)

Cada stack tiene **su carpeta con sus skills completas** (`skills/backend-node/`,
`skills/frontend-vite/`, `skills/frontend-next/`): no hay skills compartidas entre stacks —
si dos stacks resuelven el mismo tema, cada uno lleva su versión adaptada. Para sumar uno:

1. **Carpeta:** `skills/<stack>-<lado>/` (p. ej. `backend-go/`, `frontend-astro/`). Nada de
   carpetas vacías: el test de categorías exige un `SKILL.md` por subcarpeta.
2. **Nombre:** `<stack>-<tema>-<lado>` (p. ej. `go-config-env-backend`,
   `astro-arquitectura-frontend`), con `name` = carpeta. El stack va en el **prefijo** porque
   instaladas con `npx skills` las carpetas de categoría desaparecen: en destino solo queda
   el nombre como identificación.
3. **Contenido:** partir de la skill equivalente del stack vecino y adaptar código, árbol y
   comandos; mantener la estructura fija (`Regla`, `## Cuándo usarla`, `## Checklist`,
   `## Anti-patrones`, `## Solapamiento` y `Verificación (obligatoria)` con `rg` reales).
4. **Triggers:** cada trigger tiene **UN** dueño. Lo conceptual compartido ("login", "toast",
   "a11y") va a las dos skills del mismo tema y el par se registra en
   `ALLOWED_TRIGGER_PAIRS` (`test/helpers.mjs`); un trigger en tres skills rompe el test:
   se **mueve**, no se duplica.
5. **Agente:** `agents/<stack>.md` con `name` = nombre de archivo, skills hermanas citadas
   por nombre (nunca copiando su contenido) y verificación lint + typecheck + tests del stack.
6. **Docs en el mismo gesto:** fila en el catálogo `README.md` (árbol + tabla), fila en el
   mapa de situaciones de `AGENTS.md` y entrada en `CHANGELOG.md`.
7. **Verificación:** `npm test` en verde y `npx skills add . -l` listando las skills nuevas.

## Cadenas típicas por flujo

Cada eslabón asume los anteriores; seguir el orden.

- **Backend desde cero:** `node-arquitectura-backend` → `node-config-env-backend` →
  `node-autenticacion-jwt-backend` → `node-base-datos-conexion-backend` →
  `arquitectura-drizzle-backend` (si el ORM es Drizzle) → `node-validacion-entrada-backend`
  → `node-errores-respuestas-backend` → `node-logging-ops-backend` → `node-testing-backend`.
  Al diseñar cada endpoint, sumar `contrato-api-global`.
- **Frontend desde cero (elegir el stack y seguir la cadena completa):**
  - **Vite/SPA:** `vite-arquitectura-frontend` → `vite-config-env-frontend` →
    `vite-auth-frontend` → `vite-data-fetching-frontend` → `vite-formularios-frontend` →
    `vite-estados-toast-frontend` → `vite-ui-bloques-frontend` → `vite-accesibilidad-frontend`.
  - **Next.js App Router:** `next-arquitectura-frontend` → `next-config-env-frontend` →
    `next-auth-frontend` → `next-data-fetching-frontend` → `next-formularios-frontend` →
    `next-estados-toast-frontend` → `next-ui-bloques-frontend` → `next-accesibilidad-frontend`.
- **Ciclo de vida de un cambio:** `contrato-api-global` → `tdd-global` → implementación
  (skills del lado que toque) → `revision-codigo-global` → `changelog-global` →
  `postman-builder` (si hubo endpoints).
- **UI de punta a punta:** la arquitectura del stack → `data-fetching` → `formularios` →
  `estados-toast` → `ui-bloques` → `accesibilidad` (con el prefijo `vite-` o `next-` del
  stack del proyecto) → `playwright-cli` (verificar) → `changelog-global`.
- **Arranque de un proyecto:** `documentacion-proyecto-global` (set de documentos y alcance)
  → `generador-estimaciones-global` (horas por rol) → implementación (skills del stack, con
  `contrato-api-global` al diseñar endpoints) → `documentacion` (presentar cada feature).
- **Un bug:** `tdd-global` (reproducir en test) → corregir → `revision-codigo-global` →
  `changelog-global`.

## Qué NO hacer al usarlas

- No actuar solo con la description sin cargar la skill completa.
- No saltarte la `Verificación (obligatoria)` ni el lint + typecheck + tests.
- No des por terminada una skill o un agente de este repo sin `npm test` en verde.
- No trabajar sobre `main` ni `dev` directo: todo cambio nace en su rama feature desde
  `dev`, se valida antes de mergear y lo integra quien valida (`git-workflow-global`).
- No inventar el flujo cuando hay una skill que lo cubre.
- No mezclar dominios: las skills `*-backend` no tocan UI; las `*-frontend` no tocan
  servidor; las de `qa-test/` se aplican en los momentos de control (runtime, API, review).
- No duplicar entre hermanas: si dos skills se pisan, manda la sección `Solapamiento`.