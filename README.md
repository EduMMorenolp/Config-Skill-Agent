# SKILL — Repositorio de Agent Skills y Agentes

Colección independiente de **agent skills** (formato `SKILL.md`) y **agentes portables**
(markdown) organizada por categoría. Proyecto autocontenido: no depende de ningún otro
repositorio. Layout canónico (`skills/`) descubierto por el ecosistema `npx skills`
(Claude Code, Cursor, opencode, Qoder, Codex y 70+ agentes más).

## Estructura

```
SKILL/
├── AGENTS.md      # contexto y convenciones para el agente que trabaja acá
├── README.md      # este archivo
├── CHANGELOG.md   # historial de cambios (se actualiza en cada alta/modificación/baja)
├── skills/        # contenedor canónico de skills (lo descubre npx skills)
│   ├── backend/   # skills de backend (8 activas)
│   ├── frontend/  # skills de frontend (8 activas)
│   ├── qa-test/   # skills de QA/testing (3 activas)
│   ├── devops/    # reservada
│   └── global/    # skills globales front+back (7 activas)
└── agents/        # agentes portables: backend-node, database-drizzle, frontend-vite, frontend-next
```

## Catálogo

### skills/backend/

| Skill | Dispara con | Qué resuelve |
|---|---|---|
| [`arquitectura-backend`](skills/backend/arquitectura-backend/SKILL.md) | "estructura del proyecto", "dónde va este archivo", "separación de capas" | Árbol canónico, tabla de dependencias por capa, estructura única (dominio vs capa), verificación de imports violados |
| [`autenticacion-jwt-backend`](skills/backend/autenticacion-jwt-backend/SKILL.md) | "JWT", "login", "token", "refresh token", "proteger ruta" | Middleware verifyToken, tokens cortos, refresh rotation, almacenamiento seguro, hash de passwords |
| [`base-datos-conexion-backend`](skills/backend/base-datos-conexion-backend/SKILL.md) | "conexión a la base", "pool", "migraciones", "transacción" | Pool único, capa de acceso a datos, transacciones con release, migraciones versionadas |
| [`config-env-backend`](skills/backend/config-env-backend/SKILL.md) | "agregar variable de entorno", "JWT_SECRET", ".env.example" | Módulo único de config con validación fail-fast, `.env.example` como fuente de truth, cero secretos |
| [`errores-respuestas-backend`](skills/backend/errores-respuestas-backend/SKILL.md) | "error 500", "error handler", "404", "try catch" | Handler central + 404 catch-all, controllers que lanzan y no responden, shape única de error |
| [`logging-ops-backend`](skills/backend/logging-ops-backend/SKILL.md) | "logger", "no loguea", "console.log en prod", "health check" | Un logger por proyecto, niveles correctos, health check real, logs fuera del repo |
| [`testing-backend`](skills/backend/testing-backend/SKILL.md) | "test", "jest", "vitest", "supertest", "mock", "cobertura" | Pirámide de tests, BD de test aislada, fixtures centralizados, mocking correcto, CI |
| [`validacion-entrada-backend`](skills/backend/validacion-entrada-backend/SKILL.md) | "validar body", "Joi", "Zod", "400 bad request" | Middleware de validación en el 100% de rutas con input, errores 400 con details |

### skills/frontend/

| Skill | Dispara con | Qué resuelve |
|---|---|---|
| [`accesibilidad-frontend`](skills/frontend/accesibilidad-frontend/SKILL.md) | "accesibilidad", "a11y", "WCAG", "lector de pantalla", "responsive", "breakpoints" | WCAG 2.1 AA: teclado, ARIA, foco en modales, contraste 4.5:1, jerarquía de headings, mobile-first |
| [`arquitectura-frontend`](skills/frontend/arquitectura-frontend/SKILL.md) | "estructura del frontend", "dónde va este archivo", "por feature", "prop drilling", "diseno de componentes" | SPA canónica, tabla de dependencias por capa, diseño de componentes (composición > configuración), escala de estado, prop drilling ≤3 |
| [`auth-frontend`](skills/frontend/auth-frontend/SKILL.md) | "login", "guard de ruta", "sesión", "recuperar contraseña" | Paquete completo de auth: 8 flujos, guards declarativos, refresh/expiración |
| [`config-env-frontend`](skills/frontend/config-env-frontend/SKILL.md) | "VITE_", ".env.example", "secretos en el front" | Variables públicas con prefijo y cero secretos en el bundle |
| [`data-fetching-frontend`](skills/frontend/data-fetching-frontend/SKILL.md) | "tanstack query", "fetch", "cache", "cliente http", "optimistic" | Cliente por feature, query keys consistentes, un solo data layer, optimistic updates con rollback |
| [`estados-toast-frontend`](skills/frontend/estados-toast-frontend/SKILL.md) | "loading", "empty state", "toast", "reintentar" | 4 estados de vista + toast global accesible (ARIA) |
| [`formularios-frontend`](skills/frontend/formularios-frontend/SKILL.md) | "formularios", "validación", "zod", "errores inline" | Schema Zod sincronizado con el contrato, errores inline, trampas de fechas |
| [`ui-bloques-frontend`](skills/frontend/ui-bloques-frontend/SKILL.md) | "paginación", "design tokens", "tema oscuro", "changelog", "design system", "espaciado" | Paginación en URL, tokens/tema, design system adherence (anti "aesthetic AI"), formateo Intl, modal de info accesible |

### skills/global/

Skills transversales: aplican por igual a backend y frontend.

| Skill | Dispara con | Qué resuelve |
|---|---|---|
| [`changelog-global`](skills/global/changelog-global/SKILL.md) | "changelog", "historial de cambios", "agregar entrada", "unreleased", "liberar versión" | 5 categorías, entradas auto-contenidas con `Files`, fecha al final, orden inverso, cierre de versión |
| [`contrato-api-global`](skills/global/contrato-api-global/SKILL.md) | "contrato de la api", "contract first", "diseñar endpoint", "interface typescript", "cambiar la api" | Contract-first, una estrategia de errores + status, validación solo en bordes, adición > modificación, naming predecible |
| [`crear-skill-global`](skills/global/crear-skill-global/SKILL.md) | "crear skill", "nueva skill", "editar skill", "SKILL.md", "triggers" | Intención → borrador con estructura fija → description anti-trap → suite de verificación → iteración con uso real |
| [`generador-estimaciones-global`](skills/global/generador-estimaciones-global/SKILL.md) | "crear estimación", "estimar horas", "tiempos de desarrollo", "cuánto tarda", "estimación QA" | Docs HTML por rol con horas prellenadas (propuesta del agente), tabla Tarea × Horas, subtotales, total y semanas; listo para imprimir a PDF |
| [`simplificar-codigo-global`](skills/global/simplificar-codigo-global/SKILL.md) | "simplificar codigo", "refactor", "limpiar codigo", "reducir complejidad", "funcion larga" | Comportamiento idéntico con tests intactos: valla de Chesterton, 5 principios, equilibrio anti sobre-simplificación |
| [`tasks-vscode-global`](skills/global/tasks-vscode-global/SKILL.md) | "tasks.json", "tarea de vscode", "levantar servicios", "npm run dev", "task ALL" | `.vscode/tasks.json` solo de servicios dev: una task por servicio (`powershell -NoExit`, `isBackground`, panel propio) + agregadores grupo/ALL en paralelo con `dependsOn` |
| [`tdd-global`](skills/global/tdd-global/SKILL.md) | "TDD", "test primero", "red green", "reproducir el bug", "prove it", "test de regresion" | Ciclo RED-GREEN-REFACTOR, Prove-It para bugs, pirámide de tests; descubrir el stack antes del primer test |

### skills/qa-test/

Skills de verificación y control de calidad: se aplican en los momentos de control
(navegador en runtime, probar APIs, revisar antes de merge), no en la cadena de arranque.

| Skill | Dispara con | Qué resuelve |
|---|---|---|
| [`playwright-cli`](skills/qa-test/playwright-cli/SKILL.md) | "abrir en el navegador", "verificar en el browser", "screenshot de la app", "snapshot", "e2e manual" | Navegador en vivo desde la terminal: snapshots con refs, auth persistente, consola/red, loop de verificación runtime |
| [`postman-builder`](skills/qa-test/postman-builder/SKILL.md) | "crear postman", "coleccion postman", "actualizar postman", "generar json postman" | Colección Postman v2.1 derivada del código: prefix, rutas, bodies de Joi/Zod, test scripts, JSON validado |
| [`revision-codigo-global`](skills/qa-test/revision-codigo-global/SKILL.md) | "revisar codigo", "code review", "revisar el diff", "revisar PR", "antes de merge" | 5 ejes (corrección/legibilidad/arquitectura/seguridad/performance) con remedio estructural por bandera y tamaño de cambio |

### agents/

Agentes portables (formato neutral: `name` + `description` + body como prompt).

| Agente | Delegarle cuando... |
|---|---|
| [`backend-node`](agents/backend-node.md) | hay que tocar servidor Node/Express: endpoints, services, middleware, auth, validación, errores, tests de API (no toca UI) |
| [`database-drizzle`](agents/database-drizzle.md) | la tarea es centrada en la BD con Drizzle ORM: schema TS, migraciones drizzle-kit, relations v2, queries/índices, seeds y limpieza (no implementa endpoints ni UI) |
| [`frontend-vite`](agents/frontend-vite.md) | hay que tocar interfaz en un proyecto Vite/SPA: componentes, páginas, formularios, TanStack Query, a11y (no toca servidor) |
| [`frontend-next`](agents/frontend-next.md) | hay que tocar interfaz en un proyecto Next.js App Router: pages, layouts, Server Components, Server Actions, caché (no toca backend Express) |

## Orden de lectura recomendado

Para armar un proyecto desde cero con estas skills, seguir la cadena de dependencias — cada
eslabón asume los anteriores:

**Backend:**
`arquitectura-backend` → `config-env-backend` → `autenticacion-jwt-backend` → `base-datos-conexion-backend` → `validacion-entrada-backend` → `errores-respuestas-backend` → `logging-ops-backend` → `testing-backend`

**Frontend:**
`arquitectura-frontend` → `config-env-frontend` → `auth-frontend` → `data-fetching-frontend` → `formularios-frontend` → `estados-toast-frontend` → `ui-bloques-frontend` → `accesibilidad-frontend`

**Global (ambos lados):** `changelog-global` — cada cambio funcional se registra en el
`CHANGELOG.md` del servicio en el mismo gesto, sin importar de qué lado sea.
`generador-estimaciones-global` — cuando pidan tiempos de features, genera los documentos
HTML por rol con las horas propuestas, para ajustar antes de imprimir.
`crear-skill-global` — toda alta o edición de skill pasa por su checklist (intención,
borrador, verificación, iteración).
`tasks-vscode-global` — al definir cómo se levantan los servicios dev del proyecto
desde VS Code (`.vscode/tasks.json`).

**QA (`qa-test/`):** se aplican en los momentos de control, no en el arranque —
`playwright-cli` para verificar en navegador (runtime), `postman-builder` para colecciones
de API y `revision-codigo-global` antes de merge.

Las conexiones exactas entre eslabones están en la sección `## Solapamiento` de cada skill.

## Formato de una skill

Cada skill es una carpeta kebab-case con un `SKILL.md`:

```markdown
---
name: nombre-de-la-skill          # = nombre de la carpeta
description: 'Qué hace. Use when ... Triggers: "disparo 1", "disparo 2".'
---

# Título — frase de regla
**Regla:** principio rector en 1-2 líneas.

## Cuándo usarla
## Checklist de ejecución        # último paso: Verificación (obligatoria)
## Anti-patrones (cómo detectarlos)
## Solapamiento                   # solo skills de este repo
```

Regla de oro: **skills genéricas y autocontenidas** — nada de referencias a proyectos o
repositorios externos. Detalle completo en [`AGENTS.md`](AGENTS.md).

## Uso

### Skills — instalar con `npx skills` (recomendado)

El layout `skills/<categoría>/<nombre>/SKILL.md` es el contenedor canónico que el
ecosistema [skills](https://skills.sh) descubre solo: instalás directo a cualquier agente
sin tocar nada más (con `owner/repo` de GitHub publicado, o con la ruta local):

```bash
# publicado en GitHub (reemplazar owner/repo)
npx skills add <owner>/<repo> -a claude-code -a opencode

# desde una copia local de este repo
npx skills add <ruta-local>/SKILL -a claude-code -a cursor -a opencode -a qoder
```

Targets por vendor (instalación manual, equivalente al `npx skills`):

| Vendor | Proyecto | Usuario |
|---|---|---|
| Claude Code | `.claude/skills/<nombre>/` | `~/.claude/skills/<nombre>/` |
| Cursor | `.agents/skills/<nombre>/` | `~/.cursor/skills/<nombre>/` |
| opencode | `.agents/skills/<nombre>/` | `~/.config/opencode/skills/<nombre>/` |
| Qoder | `.qoder/skills/<nombre>/` | `~/.qoder/skills/<nombre>/` |
| Codex CLI | `.agents/skills/<nombre>/` | `~/.agents/skills/<nombre>/` |

Si usás `skills.paths` de `opencode.json`, apuntá a la carpeta `skills/` de este repo.

### Agentes — copia por vendor (los skills no son agentes)

`agents/<nombre>.md` es markdown neutral (`name` + `description` + body como prompt);
cada vendor lo recibe en su carpeta y agrega sus campos extra:

| Vendor | Ruta del proyecto | Extras en el frontmatter |
|---|---|---|
| Claude Code | `.claude/agents/<nombre>.md` | `tools:`, `model:` |
| opencode | `.opencode/agents/<nombre>.md` | `mode: subagent` |
| Qoder | `.qoder/agents/<nombre>.md` | `skills:`, `tools:`, `mcpServers:` |
| Cursor / Codex | — | sin subagentes propios: usan las skills |

Copiar el archivo al path del vendor y reiniciar el agente para que recargue la config.

## Agregar una skill

1. Crear `skills/<categoría>/<nombre-kebab-case>/SKILL.md` siguiendo
   [`crear-skill-global`](skills/global/crear-skill-global/SKILL.md) (intención → borrador →
   iteración → verificación).
2. Seguir el formato y las convenciones de [`AGENTS.md`](AGENTS.md) (frontmatter, secciones,
   genérica, ≤ 150 líneas).
3. Correr la verificación de `AGENTS.md` (sin referencias externas, `name` = carpeta, tamaño).
4. Agregar la fila al catálogo de este README (el catálogo vive solo acá).
5. Registrar el cambio en [`CHANGELOG.md`](CHANGELOG.md) siguiendo su **Formato EXIGENTE**
   (`Added` / `Changed` / `Fixed` / `Removed` / `Maintenance`, en `## [Unreleased]`).

## Agregar un agente

1. Crear `agents/<nombre>.md` con frontmatter mínimo (`name` = nombre de archivo,
   `description` = qué hace + cuándo delegarlo) y el body como prompt — ver
   "Convenciones al crear o editar un agente" en [`AGENTS.md`](AGENTS.md).
2. Sin campos vendor-specific (`mode`, `tools`, `model`, `mcpServers`): van en la
   tabla de mapeo de este README, no en el archivo.
3. Referenciar las skills hermanas **por nombre** (nunca copiar su contenido) y exigir
   lint + typecheck + tests en el prompt.
4. Correr la verificación de `AGENTS.md` (sección 5-6) y agregar la fila al catálogo
   `### agents/` de este README (el catálogo vive solo acá).
5. Registrar el alta en [`CHANGELOG.md`](CHANGELOG.md) en el mismo gesto.

> **Regla:** agregar, modificar o eliminar una skill o un agente → actualizar también el
> changelog, en el mismo gesto (detalle en [`AGENTS.md`](AGENTS.md) → Convenciones).
