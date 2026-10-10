---
name: arquitectura-backend
description: 'Layered structure and dependency rules for Express backends. Use when creating a new backend, deciding where a new file or module goes, refactoring folder layout, or when imports cross layers. Triggers: "estructura del proyecto", "organizar carpetas", "dónde va este archivo", "separación de capas", "agregar una capa", "imports cruzados", "arquitectura de backend", "organizar módulos", "layout del backend".'
---

# Arquitectura Backend — capas con dependencias unidireccionales

**Regla:** cada archivo vive en su capa y las capas dependen en una sola dirección
(routes → controllers → services → db). Elegir UNA estructura y no mezclarla.

## Cuándo usarla

- Proyecto nuevo: definir la estructura de carpetas desde el inicio.
- Crear un archivo o módulo nuevo y decidir dónde va.
- Refactor de estructura o sospecha de violación de capas.
- Revisión de arquitectura antes de merge.

## Checklist de ejecución

### 1. Árbol canónico

```
src/
├── app.ts              # construye la app (rutas, middleware, CORS)
├── server.ts           # punto de entrada: dotenv → app → chequeo BD → listen + banner
├── routes/             # definición de rutas por recurso (o por módulo, ver paso 3)
├── modules/<dominio>/  # por dominio: routes, controller, service
├── config/             # ÚNICO lector de process.env (ver skill config-env-backend)
├── middleware/         # auth, validación, errorHandler
├── utils/              # helpers genéricos sin dominio
└── db/                 # conexión, pool, migraciones
```

### 2. Tabla de dependencias: qué le está permitido importar

| Capa | Contenido | Puede importar | NO puede importar |
|---|---|---|---|
| `routes/` | registro de endpoints, middlewares de ruta | schemas de su módulo, middleware | services, db, config |
| `controllers/` | HTTP: leer req, llamar service, armar res | services de su dominio, middleware | db, config |
| `services/` | lógica de negocio, transacciones | db, utils, otros services del dominio | express/`req`/`res`, routes |
| `db/` | pool, queries base, migraciones | config | controllers, services |
| `config/` | lectura/validación de env | — | db, services (nunca al revés) |
| `middleware/` | auth, validación | config, utils | services de negocio pesados |
| `utils/` | helpers genéricos | — | db, config, dominio |

Reglas derivadas:

- **Unidireccionalidad:** la dependencia apunta siempre "hacia abajo". Un service jamás importa
  de una capa superior (ni `express`, ni `req`/`res`).
- **Sin imports cruzados entre módulos:** el módulo A no importa del módulo B directamente; si
  necesitan lo mismo, extraer a `utils/` o a un módulo compartido.
- **`config` solo desde el arranque** — nadie más toca `process.env` (ver skill `config-env-backend`).

### 3. Elegir UNA estructura

- **Por dominio** (preferida para servicios con varios módulos): `modules/<dominio>/{routes,controller,service}`.
- **Por capa** (legado/simple): `routes/`, `controllers/`, `services/` planos.
- **Prohibido mezclar** las dos en el mismo repo sin una frontera clara documentada.

### 4. Ubicación de cada artefacto

| Artefacto | Vive en |
|---|---|
| Schema Joi/Zod de una ruta | junto a la ruta: `<dominio>/<dominio>.schema.ts` |
| Middleware de auth/validación | `middleware/` |
| Error handler central | `middleware/` (registrado el último en `app.ts`) |
| Helper de un solo dominio | `modules/<dominio>/` |
| Helper genérico (fechas, strings) | `utils/` |
| Constantes/enum compartidos | `utils/` o `db/` si son de esquema |

### 5. Verificación (obligatoria)

```bash
# services conociendo HTTP (violación: capa de negocio importando express)
rg "from [\x27\x22]express" src/services src/modules/*/service*
# controllers tocando la BD directo (debería pasar por el service)
rg "from [\x27\x22].*(db/|drizzle|sequelize)" src/controllers src/modules/*/controller*
# config fuera del módulo config
rg "process\.env" src/ -l
# utils/middleware con dependencias de dominio o db
rg "from [\x27\x22].*(db/|modules/)" src/utils src/middleware
# imports que referencian modules/ desde dentro de modules/
rg -n "from [\x27\x22].*modules/" src/modules -g '!**/node_modules/**'
```

Cero matches en cada línea; en el último comando, revisar que cada hit apunte al **propio
módulo** o a `utils/` compartidos (apuntar a otro módulo = violación, justificarla).

## Anti-patrones (cómo detectarlos)

| Anti-patrón | Detección |
|---|---|
| Mezcla de estructura por capa y por dominio en el mismo repo | `ls src/` → coexisten `controllers/` planos y `modules/` sin frontera |
| Lógica de negocio en routes o middleware | `rg "await .*service\.\|db\." src/middleware src/routes` |
| Services que conocen HTTP (`req`/`res`) | `rg "req\.\|res\." src/services src/modules/*/service*` |
| Controllers que construyen SQL o transacciones | `rg "sql\x60\|transaction\(" src/controllers src/modules/*/controller*` |
| `process.env` leído desde cualquier archivo | `rg "process\.env" src/ -l` → más de 1-2 archivos |
| Barrel files (`index.ts` con re-exports) que generan ciclos | `rg "from [\x27\x22]\./index" src/` + errores de import circular |
| Archivos nuevos "donde queda más cómodo" | revisar que el PR respete la tabla de dependencias |

## Solapamiento

- **Base de las hermanas**: `config-env-backend`, `errores-respuestas-backend`, `validacion-entrada-backend` y
  `logging-ops-backend` asumen esta estructura de capas; ésta es la que define y audita.
- `errores-respuestas-backend` — el error handler central vive en `middleware/` y es el último del
  chain; `config-env-backend` — `config/` es el único lector de env; ambas dependen del layout de acá.
- `contrato-api-global` — el contrato de la API (interfaces, errores, naming) se diseña sobre estas capas.
