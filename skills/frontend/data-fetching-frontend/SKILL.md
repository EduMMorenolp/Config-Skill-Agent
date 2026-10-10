---
name: data-fetching-frontend
description: 'Centralized HTTP client per feature plus TanStack Query for React frontends, including optimistic updates with rollback. Use when fetching data, adding API calls, migrating scattered fetch to queries, fixing cache invalidation, adding optimistic updates, or when two data layers coexist. Triggers: "data fetching", "tanstack query", "react-query", "fetch", "llamadas a la api", "cache", "invalidar cache", "cliente http", "hooks de datos", "optimistic", "actualizacion optimista".'
---

# Data Fetching Frontend — un cliente por feature, queries para el resto

**Regla:** todo HTTP pasa por `api/<feature>.ts`; el estado remoto vive en TanStack Query
(queries/mutations con invalidación), **un solo data layer** en el repo.

## Cuándo usarla

- Agregar llamadas a la API o crear un hook de datos.
- Migrar `fetch`/servicios dispersos a queries.
- Cache que no se refresca, datos duplicados o dos formas de llamar a la API conviviendo.

## Checklist de ejecución

### 1. Cliente HTTP por feature

- `api/<feature>.ts` centraliza: URL base (de config), headers, token, manejo de error y
  tipado del contrato.
- Un solo archivo `api/client.ts` con la instancia base (interceptor de auth/errores) +
  archivos por feature que la usan.
- Los componentes **nunca** llaman `fetch`/`axios` directo.

### 2. Queries y mutations

- **Query key consistente y centralizada** por recurso: `['<recurso>', params]` — definida en
  un solo lugar (helper o constante), no strings sueltos por componente.
- Cada query: `loading` (skeleton), `error` (retry), `empty` — ver skill `estados-toast-frontend`.
- **Invalidación después de cada mutation**: `invalidateQueries` de lo afectado; regla: si la
  mutation cambia `['recurso']`, invalida `['recurso']`.
- **Optimistic updates** (la UI cambia antes de la respuesta) — el ciclo completo es
  obligatorio: `onMutate` cancela las queries del recurso y guarda el snapshot → aplicar el
  cambio con `setQueryData` → `onError` hace **rollback** con el snapshot → `onSettled`
  invalida. Sin rollback, un fallo deja un **dato fantasma** en caché.

```ts
useMutation({
  mutationFn: toggleTarea,
  onMutate: async (id) => {
    await queryClient.cancelQueries({ queryKey: ['tareas'] });
    const previo = queryClient.getQueryData(['tareas']);
    queryClient.setQueryData(['tareas'], (v) =>
      v.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
    return { previo };
  },
  onError: (_e, _id, ctx) => queryClient.setQueryData(['tareas'], ctx.previo),
  onSettled: (_d, _e, id) => queryClient.invalidateQueries({ queryKey: ['tareas'] }),
});
```

- Paginación con query params en la key para que cada página sea cacheada aparte.

### 3. Sin waterfalls, con cancelación

- **Anti-waterfall**: nunca dos `await` secuenciales de la API en el mismo efecto/carga — si
  son independientes, `Promise.all([...])`; si dependen, el segundo dentro del `.then` de la
  query que lo alimenta (o derive con `select`). Un waterfall multiplica el tiempo de carga
  por cada salto.
- **Cancelación**: pasar `signal` del `AbortSignal` de la query al `fetch`/`axios` — una query
  desmontada o cambiada cancela la request vieja en vez de resolver tarde y pisar datos
  nuevos (race condition silenciosa).
- **Prefetch**: precargar al hover/focus de un link o al entrar a la ruta padre los datos de
  la ruta hija pesada (`queryClient.prefetchQuery`); el viaje se siente instantáneo sin
  waterfalls de navegación.

### 4. Un solo data layer

- Si conviven una capa de servicios legacy ("data layer") y queries, **migrar y eliminar** la
  capa vieja en la misma tarea — nunca dos formas de llamar a la API en paralelo.
- Regla de migración: mover llamada → hook con query → borrar el servicio viejo → verificar
  consumidores.

### 5. Verificación (obligatoria)

```bash
# fetch/axios fuera de api/ (violación)
rg "fetch\(|axios" src/ -g '!src/api/**'
# query keys dispersas como strings sueltos (revisar consistencia)
rg "queryKey" src/ -c
# capa de servicios legacy conviviendo con queries
rg "useQuery|useMutation" src/ -l   # vs archivos de servicios/manuales
# token leído fuera del cliente
rg "localStorage" src/hooks src/components
# optimistic updates: cada onMutate debe tener su onError de rollback (>= en el archivo)
rg -c "onMutate" src/
rg -c "onError" src/
# requests sin cancelar (awaits encadenados en el mismo efecto / fetch sin signal)
rg "AbortController|signal" src/api -l
rg -U "await.*\n.*await" src/hooks -g '!*.test.*'
```

## Anti-patrones (cómo detectarlos)

| Anti-patrón | Detección |
|---|---|
| `fetch` inline en componentes/pages | `rg "fetch\(" src/components src/pages` |
| Dos data layers (servicios manuales + queries) conviviendo | ambos `rg "useQuery"` y servicios sin usar con `rg "export const get" src/services` |
| Query keys inconsistentes (`"users"` vs `'users'` vs template) | `rg "queryKey: \[" src/` y comparar formas |
| Mutation sin invalidación → UI desactualizada | `rg "useMutation" src/` sin `invalidateQueries` cercano |
| Optimista sin rollback → dato fantasma si falla | `rg -c "onMutate" src/` vs `rg -c "onError" src/` (el 2º debe ser ≥) |
| Estado de servidor copiado a un store (duplicado con cache) | `rg "setItems\|setList" src/store` con datos que vienen de la API |
| Loading/error resueltos con `useEffect` + `useState` manuales | `rg "useEffect" src/` + `setState` de datos remotos |
| Token adjuntado en cada llamada en vez de interceptor | `rg "Authorization" src/ -g '!src/api/**'` |
| Waterfall: `await` encadenados de la API en el mismo efecto | `rg -U "await.*\n.*await" src/hooks` |
| Requests sin cancelar → datos viejos pisando nuevos al navegar rápido | `rg "AbortController\|signal" src/api` → sin matches |

## Solapamiento

- `arquitectura-frontend` — dónde viven `api/` y `hooks/` y qué importa qué.
- `config-env-frontend` — `VITE_API_URL` se lee una sola vez en el módulo de config y se
  inyecta al cliente; ningún componente toca `import.meta.env` directo.
- `auth-frontend` — el interceptor remueve la sesión ante 401 y dispara refresh.
- `estados-toast-frontend` — los estados de cada query (skeleton/empty/error) y errores → toast.
- `formularios-frontend` — mutations de los formularios y sus errores inline.
