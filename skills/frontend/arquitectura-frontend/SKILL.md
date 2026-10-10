---
name: arquitectura-frontend
description: 'Canonical SPA structure, layer rules, component design and state decisions for React frontends. Use when creating a new frontend, deciding where a new file goes, organizing pages/components/hooks/api/store, choosing where state lives, or when imports cross features. Triggers: "estructura del frontend", "organizar carpetas", "dónde va este archivo", "por feature", "arquitectura frontend", "organizar componentes", "layout de la SPA", "imports cruzados", "prop drilling", "diseno de componentes", "donde guarda el estado".'
---

# Arquitectura Frontend — estructura canónica y capas por feature

**Regla:** una SPA con estructura canónica (`pages/components/hooks/api/store/styles`), elegida
UNA organización (por feature o por tipo), y **cero lógica de negocio en el frontend**.

## Cuándo usarla

- Proyecto nuevo: definir la estructura de la SPA desde el inicio.
- Crear un archivo (página, componente, hook, store) y decidir dónde va.
- Refactor de estructura o imports cruzados entre features.
- Revisión de arquitectura antes de merge.

## Checklist de ejecución

### 1. Árbol canónico

```
src/
├── main.tsx            # punto de entrada React (monta <App />)
├── App.tsx             # raíz con rutas
├── pages/              # una carpeta/archivo por página/ruta
├── components/         # componentes reutilizables (por feature en subcarpeta)
├── hooks/              # hooks por feature
├── api/                # cliente HTTP por feature (api/<feature>.ts)
├── store/              # stores de Zustand por dominio
└── styles/             # globales + tokens
```

### 2. Tabla de dependencias: qué importa qué

| Capa | Contenido | Puede importar | NO puede importar |
|---|---|---|---|
| `pages/` | rutas, composición | components, hooks, api, store | otras pages directamente |
| `components/` | UI reutilizable | hooks, store (lectura), styles | api (salvo wrapper de UI) |
| `hooks/` | lógica de uso (queries, efectos) | api, store | components (los renderiza la page) |
| `api/` | cliente HTTP por feature | — | store, components, hooks |
| `store/` | estado global de dominio | — | api, components (los stores no hacen fetch) |

Reglas derivadas:

- **El frontend consume una API REST**: nunca lógica de negocio propia ni acceso a datos
  directo (sin pasar por `api/`).
- **Cliente HTTP por feature** (`api/<feature>.ts`) que centraliza fetch/error/headers; los
  hooks consumen eso, jamás `fetch` inline en componentes.
- **Stores por dominio** (`store/<dominio>`): estado y acciones, sin render ni HTTP.
- **Una organización elegida:** por feature (`features/<f>/{components,hooks,api}`) o por tipo
  (árbol de arriba). Prohibido mezclar sin frontera clara.

### 3. Ubicación de cada artefacto

| Artefacto | Vive en |
|---|---|
| Página/ruta | `pages/<pagina>/` |
| Componente usado por una sola página | junto a esa página (`pages/<pagina>/components/`) |
| Componente reutilizado en ≥2 páginas | `components/<area>/` |
| Hook de una feature | `hooks/<feature>/` |
| Llamada a la API | `api/<feature>.ts` |
| Estado global de dominio | `store/<dominio>.ts` |

### 4. Componentes: diseño y estado

- **Colocación por componente**: un componente no trivial vive en su carpeta con todo lo suyo:
  `components/<área>/TaskList/` → `TaskList.tsx`, `TaskList.test.tsx`, `use-task-list.ts`
  (si el estado es complejo) y `types.ts`.
- **Composición > configuración**: preferir `children`/props mínimas
  (`<Card><CardHeader/>…</Card>`) a un componente con 8 props de variantes
  (`headerVariant`, `bodyPadding`, `content=`): cada prop de configuración es una rama de
  render que hay que testear.
- **Un componente, una responsabilidad**: el componente renderiza; los datos los traen
  `hooks/`/`pages/` (la tabla de arriba ya prohíbe `api/` en `components/`).
- **Escala de decisión de estado** — la más simple que alcanza:

| Estado | Vive en |
|---|---|
| UI local (abierto/cerrado, tab activa) | `useState` en el componente |
| Compartido entre 2-3 hermanos | lifting al padre más cercano |
| Theme/auth/locale (se lee mucho, se escribe poco) | Context |
| Filtros, paginación, estado compartible | URL (`searchParams`) — ver `ui-bloques-frontend` |
| Datos remotos con caché | TanStack Query — ver `data-fetching-frontend` |
| Cliente complejo compartido en toda la app | `store/` Zustand por dominio |

- **Prop drilling ≤ 3 niveles**: si las props atraviesan componentes que no las usan, subir a
  Context o reestructurar el árbol; 4+ niveles es deuda.

### 5. Verificación (obligatoria)

```bash
# fetch directo en componentes/pages (debería pasar por api/)
rg "fetch\(|axios" src/components src/pages
# componentes trayendo datos (debe dar 0: les corresponde a hooks/pages)
rg "useQuery" src/components
# stores haciendo HTTP
rg "fetch\(|axios" src/store
# imports entre pages (composición ilegal)
rg "from [\x27\x22].*\.\./pages/" src/pages
# drilling profundo: encadenado de 3+ puntos como prop (heurística, revisar contexto)
rg -n "=\s*[a-zA-Z]+\.[a-zA-Z]+\.[a-zA-Z]+\.[a-zA-Z]+" src/pages src/components
# estructura completa
ls src/
```

Cero matches o justificación explícita.

## Anti-patrones (cómo detectarlos)

| Anti-patrón | Detección |
|---|---|
| Mezcla de estructura por feature y por tipo sin frontera | `ls src/` → coexisten `features/` y `components/` planos sin criterio |
| `fetch`/`axios` inline en componentes | `rg "fetch\(" src/components src/pages` |
| Un "data layer" viejo coexistiendo con el data fetching moderno | dos formas de llamar a la API en paralelo (servicios legacy + queries) |
| Stores que hacen HTTP o render | `rg "fetch\(\|useEffect" src/store` |
| Páginas importándose entre sí | `rg "from [\x27\x22].*pages/" src/pages` |
| Componentes globales de un solo uso acumulándose en `components/` | carpeta `components/` sin subcarpetas y en crecimiento |
| Componente que hace fetch en vez de recibir datos | `rg "useQuery|fetch\(" src/components` → >0 |
| Prop drilling de 4+ niveles | `rg -n "=\s*\w+\.\w+\.\w+\.\w+" src/pages src/components` (heurística) |
| Componente con 8 props de configuración en vez de composición | review: interface `*Props` con ≥6 props de variante/primitivo |
| Lógica de negocio (reglas, cálculos de dominio) en el front | `rg "if \(.*(rol\|permiso\|estado)" src/components` → reglas que pertenecen al backend |

## Solapamiento

- **Base de las hermanas:** `auth-frontend`, `config-env-frontend`, `data-fetching-frontend`,
  `estados-toast-frontend`, `formularios-frontend` y `ui-bloques-frontend` asumen este layout;
  ésta lo define y audita.
- `config-env-frontend` — acá solo vive dónde está el módulo de config (punto de entrada);
  qué variables existe y quién las consume lo define esa hermana.
- `data-fetching-frontend` — reglas concretas de `api/` y queries; acá solo dónde vive y qué
  puede importar.
- `accesibilidad-frontend` — audita teclado/ARIA/responsive sobre los componentes que esta estructura organiza.
